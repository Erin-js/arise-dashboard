import { describe, expect, it } from "vitest";

import { calculateScenario } from "../lib/calculations";
import type { ScenarioCountryInput } from "../lib/types";

const brunei: ScenarioCountryInput = {
  importTonnes: 31_285.681,
  topSupplierSharePct: 62.31850922471529,
};

describe("calculateScenario", () => {
  it("returns no exposure for a 0% disruption", () => {
    const result = calculateScenario(brunei, 0);

    expect(result.disruptionPct).toBe(0);
    expect(result.topSupplierImportsTonnes).toBeCloseTo(19_496.77, 6);
    expect(result.importsExposedTonnes).toBe(0);
    expect(result.shareOfTotalImportsExposedPct).toBe(0);
    expect(result.remainingImportsTonnes).toBe(brunei.importTonnes);
  });

  it("calculates a 50% disruption", () => {
    const result = calculateScenario(brunei, 50);

    expect(result.disruptionPct).toBe(50);
    expect(result.importsExposedTonnes).toBeCloseTo(9_748.385, 6);
    expect(result.shareOfTotalImportsExposedPct).toBeCloseTo(
      31.159254612357645,
      10,
    );
    expect(result.remainingImportsTonnes).toBeCloseTo(21_537.296, 6);
  });

  it("calculates a 75% disruption", () => {
    const result = calculateScenario(brunei, 75);

    expect(result.disruptionPct).toBe(75);
    expect(result.importsExposedTonnes).toBeCloseTo(14_622.5775, 6);
    expect(result.shareOfTotalImportsExposedPct).toBeCloseTo(
      46.73888191853647,
      10,
    );
    expect(result.remainingImportsTonnes).toBeCloseTo(16_663.1035, 6);
  });

  it("clamps a disruption below 0%", () => {
    expect(calculateScenario(brunei, -25)).toEqual(
      calculateScenario(brunei, 0),
    );
  });

  it("clamps a disruption above 100%", () => {
    expect(calculateScenario(brunei, 150)).toEqual(
      calculateScenario(brunei, 100),
    );
  });

  it("rejects non-finite disruption values", () => {
    expect(() => calculateScenario(brunei, Number.NaN)).toThrow(RangeError);
    expect(() => calculateScenario(brunei, Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });
});
