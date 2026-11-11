import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Reset password - Caritas Manila FSD Donor System" };

export default function ForgotPasswordPage() {
  return (
    <main className="bg-content-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface-white border-border-soft w-full max-w-sm rounded-xl border p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
