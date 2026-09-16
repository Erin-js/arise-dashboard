import { Check, ChevronDown, MapPin } from "lucide-react";

import type { SimulatorCountryData } from "@/lib/types";

interface CountrySelectorProps {
  countries: readonly SimulatorCountryData[];
  selectedIso3: string;
  onChange: (iso3: string) => void;
}

export function CountrySelector({
  countries,
  selectedIso3,
  onChange,
}: CountrySelectorProps) {
  const selectedCountry =
    countries.find((country) => country.iso3 === selectedIso3) ?? countries[0];

  return (
    <section aria-labelledby="country-selector-title" className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-kicker">01 / Market</p>
          <h2
            id="country-selector-title"
            className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#223300]"
          >
            Select an importing economy
          </h2>
        </div>
        <MapPin aria-hidden="true" className="mt-1 size-5 text-[#4b5d16]" />
      </div>

      <div className="relative md:hidden">
        <select
          aria-label="Select an importing economy"
          className="w-full appearance-none rounded-2xl border border-[#223300]/15 bg-[#f6f4f1] px-4 py-3.5 pr-11 text-sm font-semibold text-[#223300] outline-none focus:border-[#e45c10] focus:ring-4 focus:ring-[#f2b635]/20"
          value={selectedIso3}
          onChange={(event) => onChange(event.target.value)}
        >
          {countries.map((country) => (
            <option key={country.iso3} value={country.iso3}>
              {country.name} ({country.iso3})
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#4b5d16]"
        />
      </div>

      <div
        aria-label="Importing economies"
        className="hidden grid-cols-2 gap-2 md:grid xl:grid-cols-4"
        role="radiogroup"
      >
        {countries.map((country) => {
          const isSelected = country.iso3 === selectedIso3;

          return (
            <button
              key={country.iso3}
              aria-checked={isSelected}
              className={`group relative min-h-24 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b635]/35 ${
                isSelected
                  ? "border-[#223300] bg-[#223300] text-[#f6f4f1] shadow-[0_12px_28px_rgba(34,51,0,0.16)]"
                  : "border-[#223300]/10 bg-[#f6f4f1] text-[#223300] hover:-translate-y-0.5 hover:border-[#4b5d16]/45"
              }`}
              onClick={() => onChange(country.iso3)}
              role="radio"
              type="button"
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold tracking-[0.18em] ${
                    isSelected ? "text-[#f2b635]" : "text-[#4b5d16]"
                  }`}
                >
                  {country.iso3}
                </span>
                {isSelected ? (
                  <span className="grid size-5 place-items-center rounded-full bg-[#f2b635] text-[#223300]">
                    <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span className="mt-4 block text-sm font-semibold leading-tight">
                {country.name}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCountry ? (
        <p className="text-xs leading-5 text-[#223300]/60">
          {selectedCountry.topSupplier} supplies{" "}
          <strong className="font-semibold text-[#223300]">
            {selectedCountry.topSupplierSharePct.toFixed(1)}%
          </strong>{" "}
          of reported rice imports.
        </p>
      ) : null}
    </section>
  );
}
