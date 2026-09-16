import { ArrowRight, BellRing, ShieldCheck, TriangleAlert } from "lucide-react";

import type {
  CountryProfile,
  ScenarioResult,
  SimulatorCountryData,
} from "@/lib/types";

interface ActionRecommendationProps {
  country: SimulatorCountryData;
  profile: CountryProfile;
  result: ScenarioResult;
}

export function ActionRecommendation({
  country,
  profile,
  result,
}: ActionRecommendationProps) {
  const severity =
    result.shareOfTotalImportsExposedPct >= 30
      ? "High"
      : result.shareOfTotalImportsExposedPct >= 15
        ? "Elevated"
        : "Monitor";
  const severityClass =
    severity === "High"
      ? "bg-[#e45c10] text-white"
      : severity === "Elevated"
        ? "bg-[#f2b635] text-[#223300]"
        : "bg-[#4b5d16] text-white";

  return (
    <aside
      aria-labelledby="recommendation-title"
      className="relative h-full overflow-hidden rounded-[1.75rem] bg-[#223300] p-5 text-[#f6f4f1] shadow-[0_24px_70px_rgba(34,51,0,0.18)] sm:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border-[32px] border-[#4b5d16]/30" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2b635]">
              05 / Recommended response
            </p>
            <h2
              id="recommendation-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.04em]"
            >
              Turn exposure into action
            </h2>
          </div>
          <ShieldCheck aria-hidden="true" className="size-5 text-[#f2b635]" />
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#ece2ce]/55">
              Scenario status
            </p>
            <p className="mt-1 text-sm font-semibold">{country.name}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${severityClass}`}>
            {severity}
          </span>
        </div>

        <div className="mt-7">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#ece2ce]/60">
            <BellRing aria-hidden="true" className="size-3.5" /> Priority
          </p>
          <p className="mt-3 text-xl font-medium leading-snug text-[#f2b635]">
            {profile.priority}
          </p>
        </div>

        <ol className="mt-7 space-y-2.5">
          {profile.actions.slice(0, 3).map((action, index) => (
            <li
              key={action}
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#4b5d16] font-mono text-[10px] text-[#f6f4f1]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="pt-0.5 text-sm leading-5 text-[#ece2ce]">{action}</span>
              <ArrowRight
                aria-hidden="true"
                className="ml-auto mt-1 size-3.5 shrink-0 text-[#f2b635]"
              />
            </li>
          ))}
        </ol>

        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="flex items-start gap-2 text-xs leading-5 text-[#ece2ce]/60">
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-[#f2b635]"
            />
            Watch signal: {profile.alertSignal}.
          </p>
        </div>
      </div>
    </aside>
  );
}
