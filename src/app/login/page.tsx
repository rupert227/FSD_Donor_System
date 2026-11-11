import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in - Caritas Manila FSD Donor System" };

export default function LoginPage() {
  return (
    <main className="bg-content-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface-white border-border-soft w-full max-w-sm rounded-xl border p-6 shadow-sm">
        {/* useSearchParams needs a Suspense boundary with Cache Components. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
