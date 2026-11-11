"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

const NOT_SET_UP = "Your account is not set up yet. Contact the System Administrator.";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const params = useSearchParams();

  // The proxy sends signed-in users with no role here with ?error=no-account.
  const message =
    state.error ?? (params.get("error") === "no-account" ? NOT_SET_UP : null);

  const fieldClass =
    "border-border-strong bg-surface-white text-text-primary h-10 w-full rounded-[6px] border px-3 text-[0.9rem]";

  return (
    <form action={formAction} className="focus-scope flex flex-col gap-4" noValidate>
      <div className="flex items-center gap-4">
        <Image
          src="/caritas_logo.png"
          alt="Caritas Manila logo"
          width={48}
          height={48}
          className="shrink-0"
          priority
        />
        <div>
          <h1 className="text-text-primary text-[1.35rem] leading-7 font-semibold">
            Sign in
          </h1>
          <p className="text-text-secondary text-[0.85rem]">FSD Donor System</p>
        </div>
      </div>

      {message && (
        <p
          role="alert"
          className="border-border-warning bg-surface-warning-strong text-text-warning rounded-[6px] border px-3 py-2 text-[0.85rem]"
        >
          {message}
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
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-text-primary text-[0.85rem] font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="text-text-secondary hover:bg-surface-soft-hover absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[6px]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Link
        href="/forgot-password"
        className="text-brand-primary w-fit text-[0.85rem] font-medium hover:underline"
      >
        Forgot password?
      </Link>

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-primary hover:bg-brand-primary/90 h-10 cursor-pointer rounded-[6px] text-[0.9rem] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
