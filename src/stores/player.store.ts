import { playerService } from '../services/player.service';
import type { PlayerState, PlayerWallet, RefillOutcome } from '../types/player';
import { sessionStore } from './session.store';

export type PlayerLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PlayerStoreState {
  status: PlayerLoadStatus;
  data: PlayerState | null;
  error: string | null;
  wallet: PlayerWallet | null;
  walletStatus: PlayerLoadStatus;
  walletError: string | null;
}

type Listener = (state: PlayerStoreState) => void;

const initialState = (): PlayerStoreState => ({
  status: 'idle',
  data: null,
  error: null,
  wallet: null,
  walletStatus: 'idle',
  walletError: null,
});

class PlayerStore {
  private state: PlayerStoreState = initialState();
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private loadPromise: Promise<void> | null = null;
  private walletPromise: Promise<void> | null = null;

  getState(): PlayerStoreState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<PlayerStoreState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  private currentUserId(): string | null {
    return sessionStore.getState().user?.id ?? null;
  }

  private syncUser(): string | null {
    const userId = this.currentUserId();
    if (userId !== this.userId) {
      this.userId = userId;
      this.loadPromise = null;
      this.walletPromise = null;
      this.state = initialState();
    }
    return userId;
  }

  load(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) {
      this.clear();
      return Promise.resolve();
    }

    if (!force && this.state.status === 'ready') return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    if (!this.state.data) this.setState({ status: 'loading', error: null });

    let promise: Promise<void>;
    promise = (async () => {
      try {
        const data = await playerService.loadState();
        if (this.userId !== userId) return;
        this.setState({ status: 'ready', data, error: null });
      } catch (error) {
        if (this.userId !== userId) return;
        this.setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Progres gagal dimuat.',
        });
      } finally {
        this.loadPromise = null;
      }
    })();

    this.loadPromise = promise;
    return promise;
  }

  loadWallet(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) {
      this.clear();
      return Promise.resolve();
    }

    if (!force && this.state.walletStatus === 'ready' && this.state.wallet) {
      return Promise.resolve();
    }
    if (this.walletPromise) return this.walletPromise;

    this.setState({ walletStatus: 'loading', walletError: null });

    let promise: Promise<void>;
    promise = (async () => {
      try {
        const wallet = await playerService.loadWallet();
        if (this.userId !== userId) return;
        this.setState({
          status: 'ready',
          data: wallet,
          wallet,
          walletStatus: 'ready',
          error: null,
          walletError: null,
        });
      } catch (error) {
        if (this.userId !== userId) return;
        this.setState({
          walletStatus: 'error',
          walletError: error instanceof Error ? error.message : 'Wallet gagal dimuat.',
        });
      } finally {
        this.walletPromise = null;
      }
    })();

    this.walletPromise = promise;
    return promise;
  }

  async refill(): Promise<RefillOutcome> {
    const outcome = await playerService.refillHearts();
    if (this.userId !== this.currentUserId()) return outcome;

    this.setState({
      status: 'ready',
      data: outcome.state,
      error: null,
      wallet: null,
      walletStatus: 'idle',
      walletError: null,
    });

    return outcome;
  }

  clear(): void {
    this.userId = null;
    this.loadPromise = null;
    this.walletPromise = null;
    this.state = initialState();
    for (const listener of this.listeners) listener(this.state);
  }
}

export const playerStore = new PlayerStore();
