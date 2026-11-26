import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { appEnv } from '../config/env';
import { authRepository } from '../repositories/auth.repository';
import { profileService } from '../services/profile.service';
import { getSupabase } from '../services/supabase/client';
import type { SessionState, SessionUser } from '../types/auth';
import type { ProfileRow, UserSettingsRow } from '../types/database';

type Listener = (state: SessionState) => void;

class SessionStore {
  private state: SessionState = {
    status: 'loading',
    user: null,
    recoveryMode: false,
  };

  private listeners = new Set<Listener>();
  private initPromise: Promise<void> | null = null;
  private loadPromise: Promise<void> | null = null;
  private loadPromiseUserId: string | null = null;
  private subscribed = false;

  getState(): SessionState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<SessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.bootstrap();
    return this.initPromise;
  }

  private async bootstrap(): Promise<void> {
    if (!appEnv.isSupabaseConfigured) {
      this.setState({ status: 'unconfigured', user: null });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      this.setState({ status: 'unconfigured', user: null });
      return;
    }

    if (!this.subscribed) {
      this.subscribed = true;
      authRepository.onAuthStateChange((event, session) => {
        // Defer work so we never await Supabase calls inside the auth callback.
        window.setTimeout(() => {
          void this.handleAuthEvent(event, session);
        }, 0);
      });
    }

    try {
      const { data, error } = await authRepository.getSession();
      if (error) console.error('[session] getSession failed', error);
      await this.applySession(data.session ?? null);
    } catch (error) {
      console.error('[session] bootstrap failed', error);
      this.setState({ status: 'anonymous', user: null });
    }
  }

  private async handleAuthEvent(event: AuthChangeEvent, session: Session | null): Promise<void> {
    switch (event) {
      case 'PASSWORD_RECOVERY':
        this.setState({ recoveryMode: true });
        await this.applySession(session);
        break;
      case 'SIGNED_IN':
      case 'INITIAL_SESSION':
        await this.applySession(session);
        break;
      case 'USER_UPDATED':
        await this.refresh();
        break;
      case 'SIGNED_OUT':
        this.setState({ status: 'anonymous', user: null, recoveryMode: false });
        break;
      case 'TOKEN_REFRESHED':
        break;
      default:
        break;
    }
  }

  private async applySession(session: Session | null): Promise<void> {
    if (!session?.user) {
      this.setState({ status: 'anonymous', user: null });
      return;
    }

    const userId = session.user.id;
    if (this.state.status === 'authenticated' && this.state.user?.id === userId) return;
    if (this.loadPromise && this.loadPromiseUserId === userId) return this.loadPromise;

    const email = session.user.email ?? this.state.user?.email ?? '';
    this.loadPromiseUserId = userId;

    const promise = (async () => {
      try {
        const bundle = await profileService.loadSessionUser(userId, email);

        if (!bundle) {
          console.error('[session] profile or settings row is missing for', userId);
          this.setState({ status: 'anonymous', user: null });
          return;
        }

        this.setState({ status: 'authenticated', user: bundle });
      } catch (error) {
        console.error('[session] failed to load the player bundle', error);
        this.setState({ status: 'anonymous', user: null });
      }
    })();

    this.loadPromise = promise;
    try {
      await promise;
    } finally {
      if (this.loadPromise === promise) {
        this.loadPromise = null;
        this.loadPromiseUserId = null;
      }
    }
  }

  /** Re-reads the current Supabase session and loads the player bundle. */
  async sync(): Promise<void> {
    if (!appEnv.isSupabaseConfigured) return;
    try {
      const { data } = await authRepository.getSession();
      await this.applySession(data.session ?? null);
    } catch (error) {
      console.error('[session] sync failed', error);
    }
  }

  async refresh(): Promise<void> {
    const current = this.state.user;
    if (!current) return;

    try {
      const bundle = await profileService.loadSessionUser(current.id, current.email);
      if (bundle) this.setState({ status: 'authenticated', user: bundle });
    } catch (error) {
      console.error('[session] refresh failed', error);
    }
  }

  setProfile(profile: ProfileRow): void {
    if (!this.state.user) return;
    this.setState({ user: { ...this.state.user, profile } });
  }

  setSettings(settings: UserSettingsRow): void {
    if (!this.state.user) return;
    this.setState({ user: { ...this.state.user, settings } });
  }

  patchUser(user: SessionUser): void {
    this.setState({ status: 'authenticated', user });
  }

  clearRecoveryMode(): void {
    if (!this.state.recoveryMode) return;
    this.setState({ recoveryMode: false });
  }

  async signOut(): Promise<void> {
    await authRepository.signOut().catch((error) => console.error('[session] signOut', error));
    this.setState({ status: 'anonymous', user: null, recoveryMode: false });
  }
}

export const sessionStore = new SessionStore();
