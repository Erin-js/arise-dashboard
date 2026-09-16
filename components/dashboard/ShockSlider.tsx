import type { CSSProperties } from "react";
import { Gauge, Minus, Plus } from "lucide-react";

interface ShockSliderProps {
  value: number;
  onChange: (value: number) => void;
  supplierName: string;
}

const PRESETS = [0, 25, 50, 75, 100] as const;

export function ShockSlider({
  value,
  onChange,
  supplierName,
}: ShockSliderProps) {
  const boundedValue = Math.min(Math.max(value, 0), 100);
  const rangeStyle = {
    "--range-progress": `${boundedValue}%`,
  } as CSSProperties;

  return (
    <section aria-labelledby="shock-slider-title" className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-kicker">02 / Disruption</p>
          <h2
            id="shock-slider-title"
            className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#223300]"
          >
            Apply a supplier shock
          </h2>
        </div>
        <Gauge aria-hidden="true" className="mt-1 size-5 text-[#e45c10]" />
      </div>

      <div className="rounded-[1.4rem] bg-[#223300] p-5 text-[#f6f4f1]">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ece2ce]/60">
              Supply removed
            </p>
            <p className="mt-1 text-sm text-[#ece2ce]">from {supplierName}</p>
          </div>
          <output
            aria-live="polite"
            className="font-mono text-4xl font-medium tracking-[-0.06em] text-[#f2b635]"
          >
            {boundedValue}%
          </output>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <Minus aria-hidden="true" className="size-3.5 shrink-0 text-[#ece2ce]/55" />
          <input
            aria-label={`Disruption to ${supplierName} supply`}
            className="dashboard-range"
            max={100}
            min={0}
            onChange={(event) => onChange(Number(event.target.value))}
            style={rangeStyle}
            type="range"
            value={boundedValue}
          />
          <Plus aria-hidden="true" className="size-3.5 shrink-0 text-[#ece2ce]/55" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5" aria-label="Shock presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            aria-pressed={boundedValue === preset}
            className={`rounded-xl px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b635]/35 ${
              boundedValue === preset
                ? "bg-[#f2b635] text-[#223300]"
                : "bg-[#f6f4f1] text-[#223300]/55 hover:bg-[#ece2ce] hover:text-[#223300]"
            }`}
            onClick={() => onChange(preset)}
            type="button"
          >
            {preset}%
          </button>
        ))}
      </div>
    </section>
  );
}
