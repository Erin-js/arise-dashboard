import type { ScenarioCountryInput, ScenarioResult } from "./types";

function requireFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

export function clampDisruptionPct(disruptionPct: number): number {
  requireFiniteNumber(disruptionPct, "disruptionPct");
  return Math.min(Math.max(disruptionPct, 0), 100);
}

export function calculateScenario(
  country: ScenarioCountryInput,
  disruptionPct: number,
): ScenarioResult {
  requireFiniteNumber(country.importTonnes, "country.importTonnes");
  requireFiniteNumber(
    country.topSupplierSharePct,
    "country.topSupplierSharePct",
  );

  if (country.importTonnes < 0) {
    throw new RangeError("country.importTonnes cannot be negative.");
  }
  if (
    country.topSupplierSharePct < 0 ||
    country.topSupplierSharePct > 100
  ) {
    throw new RangeError(
      "country.topSupplierSharePct must be between 0 and 100.",
    );
  }

  const boundedDisruption = clampDisruptionPct(disruptionPct);
  const topSupplierImportsTonnes =
    country.importTonnes * (country.topSupplierSharePct / 100);
  const importsExposedTonnes =
    topSupplierImportsTonnes * (boundedDisruption / 100);
  const shareOfTotalImportsExposedPct =
    country.topSupplierSharePct * (boundedDisruption / 100);
  const remainingImportsTonnes =
    country.importTonnes - importsExposedTonnes;

  return {
    disruptionPct: boundedDisruption,
    topSupplierImportsTonnes,
    importsExposedTonnes,
    shareOfTotalImportsExposedPct,
    remainingImportsTonnes,
  };
}
