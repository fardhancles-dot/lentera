import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { appOrigin } from '../config/brand';
import { requireSupabase } from '../services/supabase/client';

export const authRepository = {
  signUp(email: string, password: string, displayName: string) {
    return requireSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
  },

  signIn(email: string, password: string) {
    return requireSupabase().auth.signInWithPassword({ email, password });
  },

  signOut() {
    return requireSupabase().auth.signOut();
  },

  getSession() {
    return requireSupabase().auth.getSession();
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    const { data } = requireSupabase().auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription;
  },

  requestPasswordReset(email: string) {
    return requireSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin}/reset-password`,
    });
  },

  /** Validates the 6-digit recovery code Supabase emails for password resets. */
  verifyRecoveryOtp(email: string, token: string) {
    return requireSupabase().auth.verifyOtp({ email, token, type: 'recovery' });
  },

  updatePassword(password: string) {
    return requireSupabase().auth.updateUser({ password });
  },
};
