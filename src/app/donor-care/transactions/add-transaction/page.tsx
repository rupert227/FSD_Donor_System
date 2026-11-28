"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-care/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { TransactionForm } from "../_components/TransactionForm";
import { TransactionFormSkeleton } from "../_components/TransactionFormSkeleton";

const pageName = "Add Transaction";

export default function AddTransactionPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense fallback={<TransactionFormSkeleton mode="add" />}>
        <TransactionForm mode="add" />
      </Suspense>
    </AppShell>
  );
}
