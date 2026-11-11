"use server";

import { createClient } from "@/lib/supabase/server";

export type ResetState = { message: string | null };

export async function requestReset(
  _previous: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { message: "Enter your email address." };
  }

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // The result is ignored on purpose: the same message shows whether or not the email has an account.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/reset-password`,
  });

  return {
    message: "If that email has an account, a reset link is on its way.",
  };
}
