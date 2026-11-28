"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-care/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { TransactionForm } from "../_components/TransactionForm";
import { TransactionFormSkeleton } from "../_components/TransactionFormSkeleton";

const pageName = "Edit Transaction";

export default function EditTransactionPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense fallback={<TransactionFormSkeleton mode="edit" />}>
        <TransactionForm mode="edit" />
      </Suspense>
    </AppShell>
  );
}
