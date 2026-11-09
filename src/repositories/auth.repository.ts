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
        emailRedirectTo: `${appOrigin}/login?verified=1`,
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

  updatePassword(password: string) {
    return requireSupabase().auth.updateUser({ password });
  },

  resendConfirmation(email: string) {
    return requireSupabase().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${appOrigin}/login?verified=1` },
    });
  },
};
