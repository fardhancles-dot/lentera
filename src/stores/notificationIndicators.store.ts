import { socialService } from '../services/social.service';
import type { NotificationIndicators } from '../types/social';
import { EMPTY_NOTIFICATION_INDICATORS } from '../utils/notificationIndicators';
import { sessionStore } from './session.store';

export const NOTIFICATION_INDICATORS_TTL_MS = 30_000;

export type NotificationIndicatorsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NotificationIndicatorsState {
  counts: NotificationIndicators;
  status: NotificationIndicatorsStatus;
  loadedAt: number;
  error: string | null;
}

type Listener = (state: NotificationIndicatorsState) => void;

function initialState(): NotificationIndicatorsState {
  return {
    counts: { ...EMPTY_NOTIFICATION_INDICATORS },
    status: 'idle',
    loadedAt: 0,
    error: null,
  };
}

class NotificationIndicatorsStore {
  private state = initialState();
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private requestVersion = 0;
  private promise: Promise<void> | null = null;

  getState(): NotificationIndicatorsState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<NotificationIndicatorsState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  private syncUser(): string | null {
    const userId = sessionStore.getState().user?.id ?? null;
    if (userId !== this.userId) {
      this.userId = userId;
      this.requestVersion += 1;
      this.promise = null;
      this.state = initialState();
    }
    return userId;
  }

  /**
   * Cache one status read per session and refresh only after actions or when
   * the tab becomes visible again. No interval and no per-navigation request.
   */
  load(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return Promise.resolve();

    const fresh =
      this.state.status === 'ready' &&
      Date.now() - this.state.loadedAt < NOTIFICATION_INDICATORS_TTL_MS;
    if (!force && fresh) return Promise.resolve();
    if (this.promise) return this.promise;

    const version = this.requestVersion;
    if (this.state.status !== 'ready') {
      this.setState({ status: 'loading', error: null });
    }

    const promise = socialService
      .getNotificationIndicators()
      .then((counts) => {
        if (this.userId !== userId || this.requestVersion !== version) return;
        this.setState({
          counts,
          status: 'ready',
          loadedAt: Date.now(),
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (this.userId !== userId || this.requestVersion !== version) return;
        this.setState({
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Indikator notifikasi gagal dimuat.',
        });
      })
      .finally(() => {
        if (this.requestVersion === version) this.promise = null;
      });

    this.promise = promise;
    return promise;
  }

  refresh(): Promise<void> {
    return this.load(true);
  }

  /** Opening Misi & Pencapaian acknowledges every currently unlocked item. */
  async markAchievementsSeen(): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return;
    if (this.state.status === 'ready' && this.state.counts.achievements === 0) return;
    const hadCounts = this.state.status === 'ready';

    try {
      await socialService.markAchievementsSeen();
      if (this.userId !== userId) return;
      if (!hadCounts) {
        await this.promise;
        if (this.userId !== userId) return;
        await this.load(true);
        return;
      }
      this.setState({
        counts: { ...this.state.counts, achievements: 0 },
        status: 'ready',
        loadedAt: Date.now(),
        error: null,
      });
    } catch {
      // The badge stays until the next successful read; never create a fake
      // cleared state when the server did not confirm it.
    }
  }

  /** Opening Kotak Inbox reads follower notifications through the same state. */
  async markInboxRead(): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return;
    if (this.state.status === 'ready' && this.state.counts.inbox === 0) return;
    const hadCounts = this.state.status === 'ready';

    try {
      const updated = await socialService.markInboxNotificationsRead();
      if (this.userId !== userId) return;
      if (!hadCounts) {
        await this.promise;
        if (this.userId !== userId) return;
        await this.load(true);
        return;
      }
      this.setState({
        counts: {
          ...this.state.counts,
          inbox: 0,
          notifications: Math.max(0, this.state.counts.notifications - updated),
        },
        status: 'ready',
        loadedAt: Date.now(),
        error: null,
      });
    } catch {
      // Leave the server-backed badge in place on failure.
    }
  }

  clear(): void {
    this.userId = null;
    this.requestVersion += 1;
    this.promise = null;
    this.state = initialState();
    for (const listener of this.listeners) listener(this.state);
  }
}

export const notificationIndicatorsStore = new NotificationIndicatorsStore();
