"use server";

import { redirect } from "next/navigation";
import { homePathFor, isUserRole } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null };

const WRONG_LOGIN = "Incorrect email or password.";
const NOT_SET_UP = "Your account is not set up yet. Contact the System Administrator.";
const SUSPENDED = "This account is suspended. Contact the System Administrator.";

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createClient();

  // Same message for a wrong email and a wrong password.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { error: WRONG_LOGIN };
  }

  const { data: account } = await supabase
    .from("user_accounts")
    .select("user_role, account_status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!account || !isUserRole(account.user_role)) {
    await supabase.auth.signOut();
    return { error: NOT_SET_UP };
  }

  if (account.account_status === "Suspended") {
    await supabase.auth.signOut();
    return { error: SUSPENDED };
  }

  // redirect() must stay outside try/catch: it works by throwing.
  redirect(homePathFor(account.user_role));
}
