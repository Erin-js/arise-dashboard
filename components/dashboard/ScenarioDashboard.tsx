"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  Database,
  Globe2,
  Menu,
  Radar,
  Wheat,
  X,
} from "lucide-react";

import { calculateScenario } from "@/lib/calculations";
import type {
  CountryProfile,
  CountrySupplierData,
  SimulatorCountryData,
} from "@/lib/types";

import { ActionRecommendation } from "./ActionRecommendation";
import { CountrySelector } from "./CountrySelector";
import { ScenarioResults } from "./ScenarioResults";
import { ShockSlider } from "./ShockSlider";
import { SupplierChart } from "./SupplierChart";

interface ScenarioDashboardProps {
  countries: readonly SimulatorCountryData[];
  profiles: readonly CountryProfile[];
  supplierData: readonly CountrySupplierData[];
}

export function ScenarioDashboard({
  countries,
  profiles,
  supplierData,
}: ScenarioDashboardProps) {
  const defaultCountry =
    countries.find((country) => country.iso3 === "PHL") ?? countries[0];
  const [selectedIso3, setSelectedIso3] = useState(defaultCountry.iso3);
  const [disruptionPct, setDisruptionPct] = useState(50);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const country =
    countries.find((item) => item.iso3 === selectedIso3) ?? defaultCountry;
  const suppliers =
    supplierData.find((item) => item.countryIso3 === country.iso3) ??
    supplierData[0];
  const profile =
    profiles.find((item) => item.id === country.profileId) ?? profiles[0];

  const result = useMemo(
    () => calculateScenario(country, disruptionPct),
    [country, disruptionPct],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#ece2ce] text-[#223300]">
      <section className="relative overflow-hidden bg-[#273519] text-[#f6f4f1]">
        <div className="dashboard-orbit dashboard-orbit--one" />
        <div className="dashboard-orbit dashboard-orbit--two" />
        <div className="dashboard-grid" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <a
            aria-label="ARISE dashboard home"
            className="flex items-center gap-3"
            href="#top"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-[#f2b635] text-[#223300]">
              <Wheat aria-hidden="true" className="size-5" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.2em]">ARISE</span>
              <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#ece2ce]/50 sm:block">
                ASEAN rice intelligence
              </span>
            </span>
          </a>

          <nav
            aria-label="Dashboard navigation"
            className="hidden items-center gap-8 text-xs font-semibold text-[#ece2ce]/65 md:flex"
          >
            <a className="text-[#f6f4f1]" href="#scenario-lab">
              Scenario lab
            </a>
            <a className="transition-colors hover:text-[#f2b635]" href="#supply-structure">
              Supply structure
            </a>
            <a className="transition-colors hover:text-[#f2b635]" href="#methodology">
              Methodology
            </a>
          </nav>

          <button
            aria-controls="mobile-dashboard-navigation"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            className="grid size-10 place-items-center rounded-full border border-white/15 md:hidden"
            onClick={() => setMobileNavOpen((isOpen) => !isOpen)}
            type="button"
          >
            {mobileNavOpen ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Menu aria-hidden="true" className="size-4" />
            )}
          </button>

          {mobileNavOpen ? (
            <nav
              id="mobile-dashboard-navigation"
              aria-label="Mobile dashboard navigation"
              className="absolute left-5 right-5 top-[4.5rem] grid gap-1 rounded-2xl border border-white/10 bg-[#223300]/95 p-2 text-sm font-semibold shadow-2xl backdrop-blur-lg md:hidden"
            >
              {[
                ["Scenario lab", "#scenario-lab"],
                ["Supply structure", "#supply-structure"],
                ["Methodology", "#methodology"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  className="rounded-xl px-4 py-3 text-[#ece2ce] transition-colors hover:bg-white/10 hover:text-[#f2b635]"
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>
          ) : null}
        </header>

        <div
          id="top"
          className="relative z-[1] mx-auto grid w-full max-w-[1440px] gap-10 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:px-12 lg:pb-28 lg:pt-20"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ece2ce]/75">
              <Radar aria-hidden="true" className="size-3.5 text-[#f2b635]" />
              ASEAN rice resilience monitor
            </div>
            <h1 className="mt-7 max-w-4xl text-[clamp(3.3rem,7.2vw,7.6rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
              See the shock
              <span className="block text-[#f2b635]">before it spreads.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#ece2ce]/68 sm:text-lg sm:leading-8">
              Stress-test rice import dependence across selected ASEAN economies.
              Adjust a major-supplier disruption and turn exposure into a clear
              response plan.
            </p>
            <a
              className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#f6f4f1] px-5 py-3 text-xs font-bold text-[#223300] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b635]/40"
              href="#scenario-lab"
            >
              Run a scenario
              <span className="grid size-7 place-items-center rounded-full bg-[#e45c10] text-white">
                <ArrowDown aria-hidden="true" className="size-3.5" />
              </span>
            </a>
          </div>

          <div className="flex items-end lg:justify-end">
            <div className="w-full max-w-lg overflow-hidden rounded-[1.8rem] border border-white/12 bg-white/[0.06] backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ece2ce]/55">
                  Coverage snapshot
                </p>
                <span className="flex items-center gap-2 text-[10px] text-[#f2b635]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#f2b635]" />
                  Ready
                </span>
              </div>
              <div className="grid grid-cols-2">
                <HeroStat
                  icon={Globe2}
                  label="Economies"
                  value={String(countries.length)}
                />
                <HeroStat
                  icon={Database}
                  label="Trade base"
                  value="2024"
                />
                <HeroStat
                  icon={Wheat}
                  label="Commodity"
                  value="Rice"
                />
                <HeroStat
                  icon={Radar}
                  label="Scenario"
                  value="Supplier"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="scenario-lab"
        className="relative z-10 mx-auto -mt-10 w-full max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12"
      >
        <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-[#223300]/10 bg-[#223300]/10 shadow-[0_24px_80px_rgba(34,51,0,0.12)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-white/70 p-5 backdrop-blur-md sm:p-7">
            <CountrySelector
              countries={countries}
              onChange={setSelectedIso3}
              selectedIso3={country.iso3}
            />
          </div>
          <div className="bg-white/70 p-5 backdrop-blur-md sm:p-7">
            <ShockSlider
              onChange={setDisruptionPct}
              supplierName={country.topSupplier}
              value={result.disruptionPct}
            />
          </div>
        </div>

        <div className="mt-14">
          <ScenarioResults country={country} result={result} />
        </div>

        <div
          id="supply-structure"
          className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.75fr]"
        >
          <SupplierChart data={suppliers} disruptionPct={result.disruptionPct} />
          <ActionRecommendation
            country={country}
            profile={profile}
            result={result}
          />
        </div>
      </section>

      <footer
        id="methodology"
        className="border-t border-[#223300]/10 bg-[#e4dac5] px-5 py-7 sm:px-8 lg:px-12"
      >
        <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-3 text-[11px] leading-5 text-[#223300]/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Directional scenario model: top-supplier import share × disruption
            percentage. Not a forecast.
          </p>
          <p className="font-mono uppercase tracking-[0.12em]">
            Curated data · transparent logic · ASEAN focus
          </p>
        </div>
      </footer>
    </main>
  );
}

interface HeroStatProps {
  icon: typeof Globe2;
  label: string;
  value: string;
}

function HeroStat({ icon: Icon, label, value }: HeroStatProps) {
  return (
    <div className="border-b border-r border-white/10 p-5 last:border-b-0 odd:last:border-b sm:p-6">
      <Icon aria-hidden="true" className="size-4 text-[#f2b635]" />
      <p className="mt-6 font-mono text-2xl tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-[#ece2ce]/45">
        {label}
      </p>
    </div>
  );
}
