import { describe, expect, it } from "vitest";

import {
  climateSnapshot,
  countries,
  getCountryById,
  getProfileById,
  getSupplierData,
  profiles,
  simulatorCountries,
  sourceCatalog,
  yieldEpisodeData,
} from "../lib/data";

describe("validated ARISE data", () => {
  it("loads the expected country and simulator coverage", () => {
    expect(countries).toHaveLength(10);
    expect(simulatorCountries.map((country) => country.iso3)).toEqual([
      "BRN",
      "MYS",
      "PHL",
      "SGP",
    ]);
  });

  it("keeps profile and supplier lookups aligned", () => {
    const brunei = getCountryById("brunei-darussalam");

    expect(brunei).toBeDefined();
    expect(getProfileById(brunei!.profileId)?.code).toBe("C1");
    expect(getSupplierData(brunei!.iso3)?.topSupplier).toBe("Thailand");
    expect(profiles).toHaveLength(3);
  });

  it("loads the fixed climate, source, and yield metadata", () => {
    expect(climateSnapshot.isLive).toBe(false);
    expect(climateSnapshot.useInScenarioCalculation).toBe(false);
    expect(sourceCatalog.sources).toHaveLength(5);
    expect(yieldEpisodeData.episodes).toHaveLength(11);
    expect(yieldEpisodeData.countries).toHaveLength(8);
  });
});
