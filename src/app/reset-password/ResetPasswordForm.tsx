"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setError(null);
    setSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      setError("The password could not be changed. Request a new reset link.");
      return;
    }

    // Signed in with the new password: go to the app (the proxy sends them to their home).
    window.location.href = "/";
  }

  const fieldClass =
    "border-border-strong bg-surface-white text-text-primary h-10 w-full rounded-[6px] border px-3 text-[0.9rem]";

  return (
    <form onSubmit={handleSubmit} className="focus-scope flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-text-primary text-[1.35rem] leading-7 font-semibold">
          Choose a new password
        </h1>
        <p className="text-text-secondary text-[0.85rem]">
          Use at least {MIN_LENGTH} characters.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="border-border-warning bg-surface-warning-strong text-text-warning rounded-[6px] border px-3 py-2 text-[0.85rem]"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-text-primary text-[0.85rem] font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-text-primary text-[0.85rem] font-medium">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-brand-primary hover:bg-brand-primary/90 h-10 cursor-pointer rounded-[6px] text-[0.9rem] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? "Saving" : "Save new password"}
      </button>
    </form>
  );
}
