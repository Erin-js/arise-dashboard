import { CircleAlert, Network } from "lucide-react";

import type { CountrySupplierData } from "@/lib/types";

interface SupplierChartProps {
  data: CountrySupplierData;
  disruptionPct: number;
}

const percentage = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

export function SupplierChart({ data, disruptionPct }: SupplierChartProps) {
  const visibleSuppliers = data.suppliers.slice(0, 5);
  const visibleShare = visibleSuppliers.reduce(
    (sum, supplier) => sum + supplier.sharePct,
    0,
  );
  const otherShare = Math.max(0, 100 - visibleShare);
  const rows =
    otherShare > 0.05
      ? [
          ...visibleSuppliers,
          {
            supplierIso3: "OTH",
            supplierName: "Other suppliers",
            importTonnes: 0,
            sharePct: otherShare,
          },
        ]
      : visibleSuppliers;

  return (
    <section
      aria-labelledby="supplier-chart-title"
      className="h-full rounded-[1.75rem] bg-[#f6f4f1] p-5 shadow-[0_20px_60px_rgba(34,51,0,0.06)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dashboard-kicker">04 / Supply structure</p>
          <h2
            id="supplier-chart-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#223300]"
          >
            Supplier concentration
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#223300]/58">
            Share of reported rice imports. The orange segment shows supply lost
            under this scenario.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#ece2ce] px-3 py-2 text-xs font-semibold text-[#223300]">
          <Network aria-hidden="true" className="size-3.5 text-[#4b5d16]" />
          HHI {Math.round(data.hhi).toLocaleString("en")}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {rows.map((supplier, index) => {
          const isTopSupplier = index === 0;
          const exposedShare = isTopSupplier
            ? supplier.sharePct * (disruptionPct / 100)
            : 0;
          const retainedShare = supplier.sharePct - exposedShare;

          return (
            <div key={supplier.supplierIso3}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-[#223300]">
                  <span className="w-7 shrink-0 font-mono text-[10px] tracking-[0.1em] text-[#223300]/45">
                    {supplier.supplierIso3}
                  </span>
                  <span className="truncate">{supplier.supplierName}</span>
                  {isTopSupplier ? (
                    <span className="hidden rounded-full bg-[#f2b635]/25 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#805500] sm:inline">
                      Shock applied
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-[#223300]/65">
                  {percentage.format(supplier.sharePct)}%
                </span>
              </div>
              <div
                aria-label={`${supplier.supplierName}: ${percentage.format(supplier.sharePct)} percent of imports${isTopSupplier ? `, ${percentage.format(exposedShare)} percentage points exposed` : ""}`}
                className="flex h-3.5 overflow-hidden rounded-full bg-[#ece2ce]"
                role="img"
              >
                <span
                  className="h-full bg-[#4b5d16] transition-[width] duration-500"
                  style={{ width: `${retainedShare}%` }}
                />
                {exposedShare > 0 ? (
                  <span
                    className="h-full bg-[#e45c10] transition-[width] duration-500"
                    style={{ width: `${exposedShare}%` }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#223300]/10 pt-5">
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#223300]/60">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#4b5d16]" /> Retained supply
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#e45c10]" /> Exposed supply
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-[#223300]/50">
          <CircleAlert aria-hidden="true" className="size-3.5" />
          {data.observedSupplierCount} observed suppliers · {data.tradeDataYear}
        </p>
      </div>
    </section>
  );
}
