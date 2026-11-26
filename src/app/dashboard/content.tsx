"use client";

import DashboardSkeleton from "@/app/dashboard/skeleton";

import { AppShell } from "@/components/AppShell";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  ChartBar,
  Database,
  Filter,
  Loader,
  Receipt,
  RefreshCw,
  RotateCcw,
  UserPlus,
  X,
} from "lucide-react";
import { Dashboard } from "@/lib/types";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { LoadingScreen } from "@/components/prefabs";
import { cn } from "cn";
import { getNavbarPreset, moduleName } from "@/app/dashboard/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  clamp,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatReportDate,
} from "@/lib/utils";

const reportContentStorageKey = "dashboard-report-content";

const rrNameOrders: DropdownOption[] = [
  { key: "a-z", label: "A to Z" },
  { key: "z-a", label: "Z to A" },
];

const rrPriceOrders: DropdownOption[] = [
  { key: "targeted-low-to-high", label: "Targeted: Low to High" },
  { key: "targeted-high-to-low", label: "Targeted: High to Low" },
  { key: "collected-low-to-high", label: "Collected: Low to High" },
  { key: "collected-high-to-low", label: "Collected: High to Low" },
  { key: "uncollected-low-to-high", label: "Uncollected: Low to High" },
  { key: "uncollected-high-to-low", label: "Uncollected: High to Low" },
  { key: "ratio-low-to-high", label: "Ratio: Low to High" },
  { key: "ratio-high-to-low", label: "Ratio: High to Low" },
];

const rrDateOrders: DropdownOption[] = [
  { key: "old-to-new", label: "Newest to Oldest" },
  { key: "new-to-old", label: "Oldest to Newest" },
];

const rrStatuses: DropdownOption[] = [
  { key: "completed", label: "Completed" },
  { key: "uncompleted", label: "Uncompleted" },
];

function generatePagingItems(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "...")[] = [1];

  if (current > 3) items.push("...");

  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    items.push(p);
  }

  if (current < total - 2) items.push("...");

  items.push(total);

  return items;
}

export default function ReportsPageContent() {
  useDocumentTitle(`${moduleName}`);
  const navbarPreset = getNavbarPreset(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const appliedFilters = useRef<Dashboard.ReportFilters>({});
  const selectedFilters = useRef<Dashboard.ReportFilters>({});

  const rrAppliedFilters = useRef<Dashboard.RevenueReceiptsFilters>({});
  const rrSelectedFilters = useRef<Dashboard.RevenueReceiptsFilters>({});

  const [year, setYear] = useState<DropdownOption>();
  const [rrNameOrder, setRRNameOrder] = useState<DropdownOption>();
  const [rrPriceOrder, setRRPriceOrder] = useState<DropdownOption>();
  const [rrDateOrder, setRRDateOrder] = useState<DropdownOption>();
  const [rrStatus, setRRStatus] = useState<DropdownOption>();

  const [applyIsEnabled, setApplyIsEnabled] = useState(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [pageIsReady, setPageIsReady] = useState(false);
  const [reportIsReady, setReportIsReady] = useState(false);

  const [rrMonth, setRRMonth] = useState<DropdownOption>();
  const [rrApplyIsEnabled, setRRApplyIsEnabled] = useState(true);
  const [rrIsApplyingFilters, setRRIsApplyingFilters] = useState(false);
  const [rrPageIsReady, setRRPageIsReady] = useState(false);
  const [rrIsReady, setRRIsReady] = useState(false);
  const [rrTriggerFetch, setRRTriggerFetch] = useState(false);

  const [reportContent, setReportContent] = useState<Dashboard.Report>();
  const [rrContent, setRRContent] = useState<Dashboard.RevenueReceipts>();

  const rrFilterRef = useRef<HTMLDivElement>(null);
  const [rrIsFilterOpen, setRRIsFilterOpen] = useState(false);
  const [rrPage, setRRPage] = useState(1);

  useEffect(() => {
    if (!rrIsFilterOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rrFilterRef.current && !rrFilterRef.current.contains(target))
        setRRIsFilterOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [rrIsFilterOpen]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      setReportIsReady(false);

      try {
        const response = await fetch(
          `/api/dashboard?${searchParams.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const content = (await response.json()) as Dashboard.Report;
        setReportContent(content);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        setReportContent(Dashboard.emptyReport);
      } finally {
        if (!controller.signal.aborted) {
          setApplyIsEnabled(false);
          setPageIsReady(true);
          setReportIsReady(true);
          setIsApplyingFilters(false);
        }
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [searchParams.toString()]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      setRRIsReady(false);

      try {
        const params = new URLSearchParams();

        const pagePK = "page";
        const yearPK = "year";
        const monthPK = "month";
        const nameOrderPK = "nameOrder";
        const priceOrderPK = "priceOrder";
        const dateOrderPK = "dateOrder";
        const statusPK = "status";

        if (pagePK) params.set(pagePK, String(rrPage));
        if (year?.key) params.set(yearPK, year.key);
        if (rrMonth?.key) params.set(monthPK, rrMonth.key);
        if (rrAppliedFilters.current.nameOrder)
          params.set(nameOrderPK, rrAppliedFilters.current.nameOrder);
        if (rrAppliedFilters.current.priceOrder)
          params.set(priceOrderPK, rrAppliedFilters.current.priceOrder);
        if (rrAppliedFilters.current.dateOrder)
          params.set(dateOrderPK, rrAppliedFilters.current.dateOrder);
        if (rrAppliedFilters.current.status)
          params.set(statusPK, rrAppliedFilters.current.status);

        const response = await fetch(
          `/api/dashboard/revenue-receipts?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const content = (await response.json()) as Dashboard.RevenueReceipts;
        setRRContent(content);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setRRContent(Dashboard.emptyRevenueReceipts);
      } finally {
        if (!controller.signal.aborted) {
          setRRApplyIsEnabled(false);
          setRRPageIsReady(true);
          setRRIsReady(true);
          setRRIsApplyingFilters(false);
        }
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [rrTriggerFetch, rrMonth]);

  const report = reportContent ?? Dashboard.emptyReport;
  const revenueReceipts = rrContent ?? Dashboard.emptyRevenueReceipts;

  useEffect(() => {
    window.sessionStorage.setItem(
      reportContentStorageKey,
      JSON.stringify(report),
    );

    const yearFilter =
      report.yearOptions?.find((option) => option.key === report.year) ??
      undefined;

    setYear(yearFilter);

    appliedFilters.current.year = report.year;
    selectedFilters.current.year = report.year;
  }, [report]);

  const revenueCollectedVSTargetedMax = Math.max(
    report.report?.revenueCollectedVSTargeted?.reduce(
      (m, s) => Math.max(m, s.values?.[0] ?? 0),
      0,
    ) ?? 0,

    report.report?.revenueCollectedVSTargeted?.reduce(
      (m, s) => Math.max(m, s.values?.[1] ?? 0),
      0,
    ) ?? 0,
  );

  const rrPageSize = 5;
  const rrTotalPages = Math.max(
    1,
    Math.ceil((revenueReceipts.totalEntries ?? 1) / rrPageSize),
  );
  const rrCurrentPage = Math.min(rrPage, rrTotalPages);

  const hasFilterChanges = () => {
    return appliedFilters.current.year != selectedFilters.current.year;
  };

  const rrHasFilterChanges = () => {
    return (
      rrAppliedFilters.current.nameOrder !=
        rrSelectedFilters.current.nameOrder ||
      rrAppliedFilters.current.priceOrder !=
        rrSelectedFilters.current.priceOrder ||
      rrAppliedFilters.current.dateOrder !=
        rrSelectedFilters.current.dateOrder ||
      rrAppliedFilters.current.status != rrSelectedFilters.current.status
    );
  };

  const applyFiltersAction = async () => {
    setIsApplyingFilters(true);
    setReportIsReady(false);

    const params = new URLSearchParams(searchParams);

    const yearPK = "year";

    if (year?.key) params.set(yearPK, year.key);
    else params.delete(yearPK);

    router.replace(`${pathname}?${params.toString()}`);
  };

  const rrApplyFiltersAction = async () => {
    setRRIsApplyingFilters(true);
    setRRIsReady(false);

    rrAppliedFilters.current.nameOrder = rrSelectedFilters.current.nameOrder;
    rrAppliedFilters.current.priceOrder = rrSelectedFilters.current.priceOrder;
    rrAppliedFilters.current.dateOrder = rrSelectedFilters.current.dateOrder;
    rrAppliedFilters.current.status = rrSelectedFilters.current.status;

    setRRTriggerFetch((state) => !state);
  };

  const resetFiltersAction = () => {
    setYear(undefined);
    selectedFilters.current.year = undefined;
    setApplyIsEnabled(hasFilterChanges());
  };

  const rrResetFiltersAction = () => {
    setRRNameOrder(undefined);
    setRRPriceOrder(undefined);
    setRRDateOrder(undefined);
    setRRStatus(undefined);

    rrSelectedFilters.current.nameOrder = undefined;
    rrSelectedFilters.current.priceOrder = undefined;
    rrSelectedFilters.current.dateOrder = undefined;
    rrSelectedFilters.current.status = undefined;

    setRRApplyIsEnabled(rrHasFilterChanges());
  };

  if (!pageIsReady) {
    return (
      <AppShell navbarPreset={navbarPreset}>
        <DashboardSkeleton />
      </AppShell>
    );
  } else
    return (
      <AppShell navbarPreset={navbarPreset}>
        <div className="space-y-5">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-brand-primary h-10 w-10" />
              <div>
                <p className="text-text-primary text-[2.0rem] leading-[1.25] font-bold">
                  Dashboard
                </p>
                <p className="text-text-secondary tracking-tight">
                  {formatReportDate(report.timestamp)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center items-end gap-3">
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Year
              </label>
              {appliedFilters.current.year != selectedFilters.current.year && (
                <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                  (Unapplied)
                </label>
              )}
              <DropdownList
                label="Select year"
                selectedKey={year?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.yearOptions}
                onChange={(option) => {
                  selectedFilters.current.year = option.key;
                  setYear(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={
                  !applyIsEnabled || isApplyingFilters || !reportIsReady
                }
                onClick={applyFiltersAction}
                className="text-surface-white bg-brand-primary rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 px-3 py-2 text-[0.75rem] font-medium enabled:hover:opacity-75 disabled:cursor-not-allowed"
              >
                <Check className="text-surface-white h-4 w-4 shrink-0" />
                Apply
              </button>
              <button
                type="button"
                onClick={resetFiltersAction}
                className="border-border-soft bg-surface-white text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem]"
              >
                <RotateCcw className="text-text-secondary h-4 w-4 shrink-0" />
                Reset
              </button>
              {isApplyingFilters && (
                <div className="flex items-center justify-center gap-1 overflow-hidden">
                  <Loader className="text-brand-primary h-4 w-4 shrink-0 animate-spin" />
                  <p className="text-text-secondary text-[0.9rem]">
                    Applying Filters
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-wrap break-all">
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Total Collected Revenue
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatCurrency(report.report?.totalCollectedRevenue, false)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">
                Probability-adjusted pipeline
              </p>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Total Active Donors
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatNumber(report.report?.totalActiveDonors, true, false)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">reserved</p>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Total Active Prospects
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatNumber(report.report?.totalActiveProspects, true, false)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">reserved</p>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Total Outstanding Pledges
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatCurrency(report.report?.totalOutstandingPledges, false)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">reserved</p>
            </div>
          </div>
          <div className="grid h-98 grid-cols-2 gap-4 text-wrap break-all">
            <div className="border-border-soft bg-surface-white rounded-panel flex flex-col overflow-auto border shadow-sm">
              <div className="border-border-soft flex border-b">
                <div className="flex flex-1 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <ChartBar className="text-text-secondary h-8 w-8 shrink-0" />
                    <div>
                      <p className="text-text-primary text-[1.0rem] font-semibold">
                        Revenue - Collected vs Targeted
                      </p>
                      <p className="text-text-secondary text-[0.75rem]">
                        Based on transactions table
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-4">
                    <div className="flex items-center gap-1">
                      <div className="bg-graph-bar-primary h-4 w-4 rounded-[4px]" />
                      <p className="text-text-secondary text-[0.75rem] text-nowrap">
                        Collected
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="bg-graph-bar-secondary h-4 w-4 rounded-[4px]" />
                      <p className="text-text-secondary text-[0.75rem] text-nowrap">
                        Targeted
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {!report.report?.revenueCollectedVSTargeted?.length ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-text-secondary text-[0.8rem]">No Data</p>
                </div>
              ) : (
                <div className="scrollbar-primary flex flex-1 flex-col overflow-auto p-4">
                  <div className="flex w-max min-w-full flex-col gap-4">
                    {report.report.revenueCollectedVSTargeted?.map((entry) => {
                      return (
                        <div
                          key={entry.key}
                          className="flex min-w-fit items-center"
                        >
                          <div
                            onClick={() => {
                              setRRMonth(entry);
                            }}
                            className="hover:bg-surface-soft-hover text-text-primary rounded-l-button border-border-soft mr-1 flex h-full w-25 shrink-0 items-center border p-2 text-[0.75rem] hover:cursor-pointer"
                          >
                            <p className="truncate">{entry.label}</p>
                          </div>
                          <div className="inline-flex min-w-fit flex-1 flex-col gap-0.5">
                            <div className="flex items-center">
                              <div
                                style={{
                                  width: `${((entry.values?.[0] ?? 0) / revenueCollectedVSTargetedMax) * 90}%`,
                                }}
                                className={cn(
                                  "bg-graph-bar-primary h-4 shrink-0 rounded-r-[4px]",
                                  (entry.values?.[0] ?? 0) > 0 &&
                                    "mr-2 min-w-[1%]",
                                )}
                              />
                              <p className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                                {formatNumber(entry.values?.[0])}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <div
                                style={{
                                  width: `${((entry.values?.[1] ?? 0) / revenueCollectedVSTargetedMax) * 90}%`,
                                }}
                                className={cn(
                                  "bg-graph-bar-secondary h-4 shrink-0 rounded-r-[4px]",
                                  (entry.values?.[1] ?? 0) > 0 &&
                                    "mr-2 min-w-[1%]",
                                )}
                              />
                              <p className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                                {formatNumber(entry.values?.[1])}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel flex flex-col overflow-auto border shadow-sm">
              <div className="border-border-soft flex border-b">
                <div className="flex flex-1 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="text-text-secondary h-8 w-8 shrink-0" />
                    <div>
                      <p className="text-text-primary text-[1.0rem] font-semibold">
                        Revenue Receipts
                      </p>
                      <p className="text-text-secondary text-[0.75rem]">
                        For the month of {rrMonth?.label ?? "—"}{" "}
                        {appliedFilters.current.year ?? "(All Years)"}
                      </p>
                    </div>
                  </div>
                  <div ref={rrFilterRef} className="ml-auto">
                    <button
                      type="button"
                      onClick={() => setRRIsFilterOpen((open) => !open)}
                      className="text-surface-white bg-brand-primary rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 px-3 py-2 text-[0.75rem] font-medium enabled:hover:opacity-75 disabled:cursor-not-allowed"
                    >
                      <Filter className="text-surface-white h-4 w-4 shrink-0" />
                      Filters
                    </button>
                    <div className="relative">
                      {rrIsFilterOpen && (
                        <div className="scrollbar-primary bg-surface-white border-border-soft rounded-button absolute top-[calc(100%+1px)] right-0 z-20 border p-4 shadow-lg">
                          <div className="flex w-max flex-col">
                            <div className="border-border-soft mb-2 flex items-center border-b pb-2">
                              <p className="text-[0.8rem] font-medium">
                                Filters
                              </p>
                              <button
                                type="button"
                                onClick={() => setRRIsFilterOpen(() => false)}
                                className="hover:bg-surface-soft-hover rounded-button ml-auto flex cursor-pointer p-1 text-[0.75rem]"
                              >
                                <X className="text-text-secondary h-4 w-4 shrink-0" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-text-secondary text-[0.75rem] font-medium">
                                  Name Order
                                </label>
                                {rrAppliedFilters.current.nameOrder !=
                                  rrSelectedFilters.current.nameOrder && (
                                  <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                                    (Unapplied)
                                  </label>
                                )}
                                <DropdownList
                                  label="Select name order"
                                  selectedKey={rrNameOrder?.key}
                                  deselectOption={{
                                    key: undefined,
                                    label: "- Deselect -",
                                  }}
                                  options={rrNameOrders}
                                  onChange={(option) => {
                                    rrSelectedFilters.current.nameOrder =
                                      option.key;
                                    setRRNameOrder(option);
                                    setRRApplyIsEnabled(rrHasFilterChanges());
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-text-secondary text-[0.75rem] font-medium">
                                  Price Order
                                </label>
                                {rrAppliedFilters.current.priceOrder !=
                                  rrSelectedFilters.current.priceOrder && (
                                  <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                                    (Unapplied)
                                  </label>
                                )}
                                <DropdownList
                                  label="Select price order"
                                  selectedKey={rrPriceOrder?.key}
                                  deselectOption={{
                                    key: undefined,
                                    label: "- Deselect -",
                                  }}
                                  options={rrPriceOrders}
                                  height={12}
                                  onChange={(option) => {
                                    rrSelectedFilters.current.priceOrder =
                                      option.key;
                                    setRRPriceOrder(option);
                                    setRRApplyIsEnabled(rrHasFilterChanges());
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-text-secondary text-[0.75rem] font-medium">
                                  Date Order
                                </label>
                                {rrAppliedFilters.current.dateOrder !=
                                  rrSelectedFilters.current.dateOrder && (
                                  <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                                    (Unapplied)
                                  </label>
                                )}
                                <DropdownList
                                  label="Select date order"
                                  selectedKey={rrDateOrder?.key}
                                  deselectOption={{
                                    key: undefined,
                                    label: "- Deselect -",
                                  }}
                                  options={rrDateOrders}
                                  onChange={(option) => {
                                    rrSelectedFilters.current.dateOrder =
                                      option.key;
                                    setRRDateOrder(option);
                                    setRRApplyIsEnabled(rrHasFilterChanges());
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-text-secondary text-[0.75rem] font-medium">
                                  Status
                                </label>
                                {rrAppliedFilters.current.status !=
                                  rrSelectedFilters.current.status && (
                                  <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                                    (Unapplied)
                                  </label>
                                )}
                                <DropdownList
                                  label="Select status"
                                  selectedKey={rrStatus?.key}
                                  deselectOption={{
                                    key: undefined,
                                    label: "- Deselect -",
                                  }}
                                  options={rrStatuses}
                                  onChange={(option) => {
                                    rrSelectedFilters.current.status =
                                      option.key;
                                    setRRStatus(option);
                                    setRRApplyIsEnabled(rrHasFilterChanges());
                                  }}
                                />
                              </div>
                            </div>
                            <div className="mt-6 ml-auto flex gap-2">
                              {rrIsApplyingFilters && (
                                <div className="flex items-center justify-center gap-1 overflow-hidden">
                                  <Loader className="text-brand-primary h-4 w-4 shrink-0 animate-spin" />
                                  <p className="text-text-secondary text-[0.9rem]">
                                    Applying Filters
                                  </p>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={rrResetFiltersAction}
                                className="border-border-soft bg-surface-white text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem]"
                              >
                                <RotateCcw className="text-text-secondary h-4 w-4 shrink-0" />
                                Reset
                              </button>
                              <button
                                type="button"
                                disabled={
                                  !rrApplyIsEnabled ||
                                  rrIsApplyingFilters ||
                                  !rrIsReady
                                }
                                onClick={rrApplyFiltersAction}
                                className="text-surface-white bg-brand-primary rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 px-3 py-2 text-[0.75rem] font-medium enabled:hover:opacity-75 disabled:cursor-not-allowed"
                              >
                                <Check className="text-surface-white h-4 w-4 shrink-0" />
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {!report.report?.revenueCollectedVSTargeted?.length ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-text-secondary text-[0.8rem]">No Data</p>
                </div>
              ) : (
                <div className="scrollbar-primary flex flex-1 flex-col overflow-auto">
                  {!rrIsReady ? (
                    <div className="flex h-full">
                      <LoadingScreen
                        label="Fetching Revenue Receipts"
                        className="text-[1.0rem]"
                      />
                    </div>
                  ) : (
                    <div className="scrollbar-primary flex h-full flex-1 flex-col overflow-auto p-4">
                      <div className="flex min-w-full flex-col gap-2">
                        {revenueReceipts.receipts?.map((receipt) => (
                          <div
                            key={receipt.name}
                            className="border-border-soft/50 bg-text-secondary/5 flex w-max min-w-full items-center gap-8 rounded-[8px] border px-4 py-2 break-normal shadow-sm"
                          >
                            <div className="flex flex-col">
                              <p className="text-[1.0rem] font-medium">
                                {receipt.name}
                              </p>
                              <p className="text-text-secondary text-[0.8rem]">
                                {receipt.timestamp}
                              </p>
                            </div>
                            <div className="ml-auto flex w-full flex-col gap-1">
                              <div className="text-text-primary flex">
                                <div className="ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                                  <p>
                                    {formatCurrency(
                                      receipt.amount?.[0],
                                      false,
                                      false,
                                    )}{" "}
                                    /{" "}
                                    {formatCurrency(
                                      receipt.amount?.[1],
                                      false,
                                      false,
                                    )}
                                  </p>
                                  <p className="text-text-muted">•</p>
                                  <p className="font-semibold">
                                    {formatPercent(receipt.amount?.[2], false)}
                                  </p>
                                </div>
                              </div>
                              <div className="bg-text-muted/25 h-2 rounded-full">
                                <div
                                  style={{
                                    backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(receipt.amount?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                                    width: `${(receipt.amount?.[2] ?? 0) * 100}%`,
                                  }}
                                  className="h-2 max-w-full rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-border-soft flex justify-end border-t p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRRPage(rrCurrentPage - 1);
                        setRRTriggerFetch((state) => !state);
                      }}
                      disabled={rrCurrentPage <= 1}
                      className="rounded-button border-border-soft enabled:hover:bg-surface-soft-hover disabled:opacity-button-disabled flex h-8 w-8 items-center justify-center border hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                    </button>
                    {generatePagingItems(rrCurrentPage, rrTotalPages).map(
                      (page, index) =>
                        page === "..." ? (
                          <span key={`gap-${page}-${index}`} className="px-2">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            type="button"
                            onClick={() => {
                              setRRPage(page);
                              setRRTriggerFetch((state) => !state);
                            }}
                            className={cn(
                              "rounded-button h-8 min-w-8 border px-2 text-[0.75rem] hover:cursor-pointer",
                              page === rrCurrentPage
                                ? "border-brand-primary bg-brand-primary text-surface-white font-semibold"
                                : "border-border-strong hover:bg-surface-soft-hover",
                            )}
                          >
                            {page}
                          </button>
                        ),
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setRRPage(rrCurrentPage + 1);
                        setRRTriggerFetch((state) => !state);
                      }}
                      disabled={rrCurrentPage >= rrTotalPages}
                      className="rounded-button border-border-soft enabled:hover:bg-surface-soft-hover disabled:opacity-button-disabled flex h-8 w-8 items-center justify-center border hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid h-50 grid-cols-3 gap-4 text-wrap break-all">
            <div className="border-border-soft bg-surface-white rounded-panel h-fit border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <UserPlus className="text-text-secondary h-4 w-4 shrink-0" />
                <p className="text-text-primary text-[0.9rem] font-medium">
                  Donor Conversion
                </p>
              </div>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex">
                    <p className="text-text-primary text-[0.8rem]">
                      New proposals drafted
                    </p>
                    <div className="text-text-primary ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                      <p>
                        {formatNumber(
                          report.report?.donorConversion
                            ?.newProposalsDrafted?.[0],
                          true,
                          false,
                        )}{" "}
                        /{" "}
                        {formatNumber(
                          report.report?.donorConversion
                            ?.newProposalsDrafted?.[1],
                          true,
                          false,
                        )}
                      </p>
                      <p className="text-text-muted">•</p>
                      <p className="font-semibold">
                        {formatPercent(
                          report.report?.donorConversion
                            ?.newProposalsDrafted?.[2],
                          false,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-text-muted/25 h-2 rounded-full">
                    <div
                      style={{
                        backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(report.report?.donorConversion?.newProposalsDrafted?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                        width: `${(report.report?.donorConversion?.newProposalsDrafted?.[2] ?? 0) * 100}%`,
                      }}
                      className="h-2 max-w-full rounded-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex">
                    <p className="text-text-primary text-[0.8rem]">
                      Leads converted
                    </p>
                    <div className="text-text-primary ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                      <p>
                        {formatNumber(
                          report.report?.donorConversion?.leadsConverted?.[0],
                          true,
                          false,
                        )}{" "}
                        /{" "}
                        {formatNumber(
                          report.report?.donorConversion?.leadsConverted?.[1],
                          true,
                          false,
                        )}
                      </p>
                      <p className="text-text-muted">•</p>
                      <p className="font-semibold">
                        {formatPercent(
                          report.report?.donorConversion?.leadsConverted?.[2],
                          false,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-text-muted/25 h-2 rounded-full">
                    <div
                      style={{
                        backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(report.report?.donorConversion?.leadsConverted?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                        width: `${(report.report?.donorConversion?.leadsConverted?.[2] ?? 0) * 100}%`,
                      }}
                      className="h-2 max-w-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel h-fit border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-text-secondary h-4 w-4 shrink-0" />
                <p className="text-text-primary text-[0.9rem] font-medium">
                  Donor Retention
                </p>
              </div>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-text-primary flex">
                    <p className="text-[0.8rem]">Renewals contacted</p>
                    <div className="ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                      <p>
                        {formatNumber(
                          report.report?.donorRetention?.renewalsContacted?.[0],
                          true,
                          false,
                        )}{" "}
                        /{" "}
                        {formatNumber(
                          report.report?.donorRetention?.renewalsContacted?.[1],
                          true,
                          false,
                        )}
                      </p>
                      <p className="text-text-muted">•</p>
                      <p className="font-semibold">
                        {formatPercent(
                          report.report?.donorRetention?.renewalsContacted?.[2],
                          false,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-text-muted/25 h-2 rounded-full">
                    <div
                      style={{
                        backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(report.report?.donorRetention?.renewalsContacted?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                        width: `${(report.report?.donorRetention?.renewalsContacted?.[2] ?? 0) * 100}%`,
                      }}
                      className="h-2 max-w-full rounded-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-text-primary flex">
                    <p className="text-[0.8rem]">Dormant donors reactivated</p>
                    <div className="ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                      <p>
                        {formatNumber(
                          report.report?.donorRetention
                            ?.dormantDonorsReactivated?.[0],
                          true,
                          false,
                        )}{" "}
                        /{" "}
                        {formatNumber(
                          report.report?.donorRetention
                            ?.dormantDonorsReactivated?.[1],
                          true,
                          false,
                        )}
                      </p>
                      <p className="text-text-muted">•</p>
                      <p className="font-semibold">
                        {formatPercent(
                          report.report?.donorRetention
                            ?.dormantDonorsReactivated?.[2],
                          false,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-text-muted/25 h-2 rounded-full">
                    <div
                      style={{
                        backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(report.report?.donorRetention?.dormantDonorsReactivated?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                        width: `${(report.report?.donorRetention?.dormantDonorsReactivated?.[2] ?? 0) * 100}%`,
                      }}
                      className="h-2 max-w-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel h-fit border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Database className="text-text-secondary h-4 w-4 shrink-0" />
                <p className="text-text-primary text-[0.9rem] font-medium">
                  Donor Care
                </p>
              </div>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-text-primary flex">
                    <p className="text-[0.8rem]">Bank deposits verified</p>
                    <div className="ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                      <p>
                        {formatNumber(
                          report.report?.donorCare?.bankDepositsVerified?.[0],
                          true,
                          false,
                        )}{" "}
                        /{" "}
                        {formatNumber(
                          report.report?.donorCare?.bankDepositsVerified?.[1],
                          true,
                          false,
                        )}
                      </p>
                      <p className="text-text-muted">•</p>
                      <p className="font-semibold">
                        {formatPercent(
                          report.report?.donorCare?.bankDepositsVerified?.[2],
                          false,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-text-muted/25 h-2 rounded-full">
                    <div
                      style={{
                        backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(report.report?.donorCare?.bankDepositsVerified?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                        width: `${(report.report?.donorCare?.bankDepositsVerified?.[2] ?? 0) * 100}%`,
                      }}
                      className="h-2 max-w-full rounded-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex">
                    <p className="text-text-primary text-[0.8rem]">
                      Receipts dispatched
                    </p>
                    <div className="text-text-primary ml-auto flex gap-1 text-[0.8rem] text-nowrap">
                      <p>
                        {formatNumber(
                          report.report?.donorCare?.receiptsDispatched?.[0],
                          true,
                          false,
                        )}{" "}
                        /{" "}
                        {formatNumber(
                          report.report?.donorCare?.receiptsDispatched?.[1],
                          true,
                          false,
                        )}
                      </p>
                      <p className="text-text-muted">•</p>
                      <p className="font-semibold">
                        {formatPercent(
                          report.report?.donorCare?.receiptsDispatched?.[2],
                          false,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-text-muted/25 h-2 rounded-full">
                    <div
                      style={{
                        backgroundColor: `color-mix(in hsl, var(--bar-positive) ${clamp(report.report?.donorCare?.receiptsDispatched?.[2] ?? 0, 0, 1) * 100}%, var(--bar-negative))`,
                        width: `${(report.report?.donorCare?.receiptsDispatched?.[2] ?? 0) * 100}%`,
                      }}
                      className="h-2 max-w-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
}
