import { ArrowDownRight, Boxes, Ship, Warehouse } from "lucide-react";

import type { ScenarioResult, SimulatorCountryData } from "@/lib/types";

interface ScenarioResultsProps {
  country: SimulatorCountryData;
  result: ScenarioResult;
}

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

export function ScenarioResults({
  country,
  result,
}: ScenarioResultsProps) {
  const cards = [
    {
      label: "Total imports",
      value: `${compactNumber.format(country.importTonnes)} t`,
      note: `Reported in ${country.tradeDataYear}`,
      icon: Ship,
      tone: "cream",
    },
    {
      label: "Volume exposed",
      value: `${compactNumber.format(result.importsExposedTonnes)} t`,
      note: "Imports at immediate risk",
      icon: ArrowDownRight,
      tone: "orange",
    },
    {
      label: "Import exposure",
      value: `${percent.format(result.shareOfTotalImportsExposedPct)}%`,
      note: "Share of total imports",
      icon: Boxes,
      tone: "yellow",
    },
    {
      label: "Imports remaining",
      value: `${compactNumber.format(result.remainingImportsTonnes)} t`,
      note: "After simulated shock",
      icon: Warehouse,
      tone: "green",
    },
  ] as const;

  return (
    <section aria-labelledby="scenario-results-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="dashboard-kicker">03 / Estimated impact</p>
          <h2
            id="scenario-results-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#223300]"
          >
            Scenario results
          </h2>
        </div>
        <p className="rounded-full border border-[#223300]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#223300]/60">
          {country.name} · {result.disruptionPct}% shock
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article
            key={label}
            className={`result-card result-card--${tone} min-h-48 rounded-[1.5rem] p-5`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] opacity-65">
                {label}
              </p>
              <Icon aria-hidden="true" className="size-4 opacity-70" />
            </div>
            <p className="mt-9 font-mono text-[clamp(1.75rem,3vw,2.45rem)] font-medium leading-none tracking-[-0.07em]">
              {value}
            </p>
            <p className="mt-4 text-xs opacity-65">{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
