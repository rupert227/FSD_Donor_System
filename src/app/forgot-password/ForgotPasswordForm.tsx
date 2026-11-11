"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestReset, type ResetState } from "./actions";

const initialState: ResetState = { message: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestReset, initialState);

  return (
    <form action={formAction} className="focus-scope flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-text-primary text-[1.35rem] leading-7 font-semibold">
          Reset your password
        </h1>
        <p className="text-text-secondary text-[0.85rem]">
          Enter your email address and we will send you a link.
        </p>
      </div>

      {state.message && (
        <p
          role="status"
          className="border-border-soft bg-surface-soft text-text-primary rounded-[6px] border px-3 py-2 text-[0.85rem]"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-text-primary text-[0.85rem] font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-border-strong bg-surface-white text-text-primary h-10 w-full rounded-[6px] border px-3 text-[0.9rem]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-primary hover:bg-brand-primary/90 h-10 cursor-pointer rounded-[6px] text-[0.9rem] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Sending" : "Send reset link"}
      </button>

      <Link
        href="/login"
        className="text-brand-primary w-fit text-[0.85rem] font-medium hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
