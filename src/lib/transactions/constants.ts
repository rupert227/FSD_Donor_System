import type { TreasuryClearanceStatusEnum } from "@/types";

/**
 * The transactions table requires an official receipt no. and it must be unique,
 * but Treasury only issues the real one later. Until then a transaction holds a
 * placeholder that starts with this prefix.
 */
export const PENDING_RECEIPT_PREFIX = "PENDING-";

export function isPendingReceiptNo(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PENDING_RECEIPT_PREFIX));
}

/**
 * What staff see for each clearance stage. The database keeps the stored enum
 * values; only the wording on screen changes here, so no migration is needed.
 */
export const STAGE_LABELS: Record<TreasuryClearanceStatusEnum, string> = {
  "Receipt Verification": "Receipt Verification",
  "Certificate Creation": "COD with Finance",
  "Dispatch Preparation": "Dispatch Preparation",
  "Transaction Finalized": "Transaction Finalized",
};
