import type { AppRole, ProfileRow, UserSettingsRow } from './database';

export interface SessionUser {
  id: string;
  email: string;
  profile: ProfileRow;
  settings: UserSettingsRow;
  role: AppRole;
}

export type AuthStatus = 'loading' | 'unconfigured' | 'anonymous' | 'authenticated';

export interface SessionState {
  status: AuthStatus;
  user: SessionUser | null;
  /** True while the user arrived from a password recovery email. */
  recoveryMode: boolean;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; field?: 'email' | 'password' | 'username' | 'displayName' };
