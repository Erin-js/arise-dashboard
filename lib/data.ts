import climateSnapshotJson from "../data/climate-snapshot.json";
import countriesJson from "../data/generated/countries.json";
import suppliersJson from "../data/generated/suppliers.json";
import yieldEpisodesJson from "../data/generated/yield-episodes.json";
import profilesJson from "../data/profiles.json";
import sourcesJson from "../data/sources.json";

import {
  COUNTRY_PROFILE_IDS,
  type ClimateSeasonOutlook,
  type ClimateSnapshot,
  type CountryData,
  type CountryProfile,
  type CountryProfileId,
  type CountrySupplierData,
  type CountryYieldEpisodes,
  type ProfileColor,
  type SimulatorCountryData,
  type SourceCatalog,
  type SourceCatalogEntry,
  type SourceFilters,
  type SupplierShare,
  type YieldEpisodeAnomaly,
  type YieldEpisodeData,
  type YieldEpisodeDefinition,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataValidationError";
  }
}

function fail(path: string, message: string): never {
  throw new DataValidationError(`${path}: ${message}`);
}

function expectRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "expected an object");
  }
  return value as UnknownRecord;
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }
  return value;
}

function expectString(record: UnknownRecord, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${path}.${key}`, "expected a non-empty string");
  }
  return value;
}

function expectOptionalString(
  record: UnknownRecord,
  key: string,
  path: string,
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${path}.${key}`, "expected a non-empty string when provided");
  }
  return value;
}

function expectNumber(record: UnknownRecord, key: string, path: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${path}.${key}`, "expected a finite number");
  }
  return value;
}

function expectInteger(record: UnknownRecord, key: string, path: string): number {
  const value = expectNumber(record, key, path);
  if (!Number.isInteger(value)) {
    fail(`${path}.${key}`, "expected an integer");
  }
  return value;
}

function expectNullableNumber(
  record: UnknownRecord,
  key: string,
  path: string,
): number | null {
  if (record[key] === null) return null;
  return expectNumber(record, key, path);
}

function expectNullableString(
  record: UnknownRecord,
  key: string,
  path: string,
): string | null {
  if (record[key] === null) return null;
  return expectString(record, key, path);
}

function expectNullableInteger(
  record: UnknownRecord,
  key: string,
  path: string,
): number | null {
  if (record[key] === null) return null;
  return expectInteger(record, key, path);
}

function expectBoolean(
  record: UnknownRecord,
  key: string,
  path: string,
): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    fail(`${path}.${key}`, "expected a boolean");
  }
  return value;
}

function expectStringArray(value: unknown, path: string): string[] {
  return expectArray(value, path).map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      fail(`${path}[${index}]`, "expected a non-empty string");
    }
    return item;
  });
}

function assertPercentage(value: number, path: string): void {
  if (value < 0 || value > 100) {
    fail(path, "expected a percentage between 0 and 100");
  }
}

function assertNonNegative(value: number, path: string): void {
  if (value < 0) {
    fail(path, "expected a non-negative number");
  }
}

function assertUnique<T>(
  items: readonly T[],
  key: (item: T) => string,
  path: string,
): void {
  const seen = new Set<string>();
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) fail(path, `duplicate value ${value}`);
    seen.add(value);
  }
}

function isCountryProfileId(value: string): value is CountryProfileId {
  return (COUNTRY_PROFILE_IDS as readonly string[]).includes(value);
}

function parseCountries(value: unknown): CountryData[] {
  const countries = expectArray(value, "countries").map((item, index) => {
    const path = `countries[${index}]`;
    const record = expectRecord(item, path);
    const profileId = expectString(record, "profileId", path);
    if (!isCountryProfileId(profileId)) {
      fail(`${path}.profileId`, `unknown profile ${profileId}`);
    }

    const country: CountryData = {
      id: expectString(record, "id", path),
      iso3: expectString(record, "iso3", path),
      name: expectString(record, "name", path),
      domesticDataYear: expectInteger(record, "domesticDataYear", path),
      productionTonnes: expectNumber(record, "productionTonnes", path),
      domesticUseTonnes: expectNumber(record, "domesticUseTonnes", path),
      selfSufficiencyPct: expectNumber(record, "selfSufficiencyPct", path),
      productionBalanceTonnes: expectNumber(
        record,
        "productionBalanceTonnes",
        path,
      ),
      productionShortfallTonnes: expectNumber(
        record,
        "productionShortfallTonnes",
        path,
      ),
      productionShortfallPct: expectNumber(
        record,
        "productionShortfallPct",
        path,
      ),
      beginningStockTonnes: expectNumber(
        record,
        "beginningStockTonnes",
        path,
      ),
      beginningStockToUsePct: expectNumber(
        record,
        "beginningStockToUsePct",
        path,
      ),
      profileCode: expectString(record, "profileCode", path),
      profileId,
      simulatorEnabled: expectBoolean(record, "simulatorEnabled", path),
      supplierDataAvailable: expectBoolean(
        record,
        "supplierDataAvailable",
        path,
      ),
      tradeDataYear: expectNullableInteger(record, "tradeDataYear", path),
      importTonnes: expectNullableNumber(record, "importTonnes", path),
      hhi: expectNullableNumber(record, "hhi", path),
      effectiveSuppliers: expectNullableNumber(
        record,
        "effectiveSuppliers",
        path,
      ),
      topSupplier: expectNullableString(record, "topSupplier", path),
      topSupplierIso3: expectNullableString(record, "topSupplierIso3", path),
      topSupplierSharePct: expectNullableNumber(
        record,
        "topSupplierSharePct",
        path,
      ),
      observedSupplierCount: expectNullableInteger(
        record,
        "observedSupplierCount",
        path,
      ),
    };

    if (!/^[A-Z]{3}$/.test(country.iso3)) {
      fail(`${path}.iso3`, "expected a three-letter uppercase ISO code");
    }
    assertNonNegative(country.productionTonnes, `${path}.productionTonnes`);
    if (country.domesticUseTonnes <= 0) {
      fail(`${path}.domesticUseTonnes`, "expected a positive number");
    }
    assertNonNegative(
      country.productionShortfallTonnes,
      `${path}.productionShortfallTonnes`,
    );
    assertPercentage(
      country.productionShortfallPct,
      `${path}.productionShortfallPct`,
    );
    assertNonNegative(
      country.beginningStockTonnes,
      `${path}.beginningStockTonnes`,
    );
    if (country.topSupplierSharePct !== null) {
      assertPercentage(
        country.topSupplierSharePct,
        `${path}.topSupplierSharePct`,
      );
    }

    const tradeFields = [
      country.tradeDataYear,
      country.importTonnes,
      country.hhi,
      country.effectiveSuppliers,
      country.topSupplier,
      country.topSupplierIso3,
      country.topSupplierSharePct,
      country.observedSupplierCount,
    ];
    const hasAllTradeFields = tradeFields.every((field) => field !== null);
    const hasNoTradeFields = tradeFields.every((field) => field === null);
    if (!hasAllTradeFields && !hasNoTradeFields) {
      fail(path, "trade fields must be either all populated or all null");
    }
    if (country.supplierDataAvailable !== hasAllTradeFields) {
      fail(path, "supplierDataAvailable does not match the trade fields");
    }
    if (country.simulatorEnabled && !hasAllTradeFields) {
      fail(path, "simulator-enabled countries require complete trade data");
    }

    return country;
  });

  assertUnique(countries, (country) => country.id, "countries.id");
  assertUnique(countries, (country) => country.iso3, "countries.iso3");
  return countries;
}

function parseProfiles(value: unknown): CountryProfile[] {
  const profiles = expectArray(value, "profiles").map((item, index) => {
    const path = `profiles[${index}]`;
    const record = expectRecord(item, path);
    const id = expectString(record, "id", path);
    if (!isCountryProfileId(id)) {
      fail(`${path}.id`, `unknown profile ${id}`);
    }
    const color = expectString(record, "color", path);
    if (!(["coral", "amber", "green"] as const).includes(color as ProfileColor)) {
      fail(`${path}.color`, `unsupported profile color ${color}`);
    }
    return {
      code: expectString(record, "code", path),
      id,
      name: expectString(record, "name", path),
      color: color as ProfileColor,
      memberIso3: expectStringArray(record.memberIso3, `${path}.memberIso3`),
      priority: expectString(record, "priority", path),
      actions: expectStringArray(record.actions, `${path}.actions`),
      alertSignal: expectString(record, "alertSignal", path),
    };
  });
  assertUnique(profiles, (profile) => profile.id, "profiles.id");
  assertUnique(profiles, (profile) => profile.code, "profiles.code");
  return profiles;
}

function parseSupplier(value: unknown, path: string): SupplierShare {
  const record = expectRecord(value, path);
  const supplier: SupplierShare = {
    supplierIso3: expectString(record, "supplierIso3", path),
    supplierName: expectString(record, "supplierName", path),
    importTonnes: expectNumber(record, "importTonnes", path),
    sharePct: expectNumber(record, "sharePct", path),
  };
  assertNonNegative(supplier.importTonnes, `${path}.importTonnes`);
  assertPercentage(supplier.sharePct, `${path}.sharePct`);
  return supplier;
}

function parseSuppliers(value: unknown): CountrySupplierData[] {
  const data = expectArray(value, "suppliers").map((item, index) => {
    const path = `suppliers[${index}]`;
    const record = expectRecord(item, path);
    const suppliers = expectArray(record.suppliers, `${path}.suppliers`).map(
      (supplier, supplierIndex) =>
        parseSupplier(supplier, `${path}.suppliers[${supplierIndex}]`),
    );
    const result: CountrySupplierData = {
      countryIso3: expectString(record, "countryIso3", path),
      countryName: expectString(record, "countryName", path),
      tradeDataYear: expectInteger(record, "tradeDataYear", path),
      totalImportTonnes: expectNumber(record, "totalImportTonnes", path),
      hhi: expectNumber(record, "hhi", path),
      effectiveSuppliers: expectNumber(record, "effectiveSuppliers", path),
      observedSupplierCount: expectInteger(
        record,
        "observedSupplierCount",
        path,
      ),
      topSupplier: expectString(record, "topSupplier", path),
      topSupplierIso3: expectString(record, "topSupplierIso3", path),
      topSupplierSharePct: expectNumber(
        record,
        "topSupplierSharePct",
        path,
      ),
      suppliers,
    };
    if (suppliers.length === 0) fail(`${path}.suppliers`, "cannot be empty");
    if (result.observedSupplierCount !== suppliers.length) {
      fail(path, "observedSupplierCount does not match suppliers.length");
    }
    assertPercentage(result.topSupplierSharePct, `${path}.topSupplierSharePct`);
    return result;
  });
  assertUnique(data, (item) => item.countryIso3, "suppliers.countryIso3");
  return data;
}

function parseClimateSnapshot(value: unknown): ClimateSnapshot {
  const path = "climateSnapshot";
  const record = expectRecord(value, path);
  const seasonalOutlook: ClimateSeasonOutlook[] = expectArray(
    record.seasonalOutlook,
    `${path}.seasonalOutlook`,
  ).map((item, index) => {
    const itemPath = `${path}.seasonalOutlook[${index}]`;
    const itemRecord = expectRecord(item, itemPath);
    const season: ClimateSeasonOutlook = {
      season: expectString(itemRecord, "season", itemPath),
      period: expectString(itemRecord, "period", itemPath),
      elNinoProbabilityPct: expectNumber(
        itemRecord,
        "elNinoProbabilityPct",
        itemPath,
      ),
      veryStrongProbabilityPct: expectNumber(
        itemRecord,
        "veryStrongProbabilityPct",
        itemPath,
      ),
    };
    assertPercentage(
      season.elNinoProbabilityPct,
      `${itemPath}.elNinoProbabilityPct`,
    );
    assertPercentage(
      season.veryStrongProbabilityPct,
      `${itemPath}.veryStrongProbabilityPct`,
    );
    if (season.veryStrongProbabilityPct > season.elNinoProbabilityPct) {
      fail(itemPath, "very-strong probability cannot exceed El Niño probability");
    }
    return season;
  });

  const snapshot: ClimateSnapshot = {
    issuedDate: expectString(record, "issuedDate", path),
    issuedMonth: expectString(record, "issuedMonth", path),
    status: expectString(record, "status", path),
    headline: expectString(record, "headline", path),
    period: expectString(record, "period", path),
    peakVeryStrongProbabilityPct: expectNumber(
      record,
      "peakVeryStrongProbabilityPct",
      path,
    ),
    peakSeason: expectString(record, "peakSeason", path),
    seasonalOutlook,
    sourceId: expectString(record, "sourceId", path),
    isLive: expectBoolean(record, "isLive", path),
    useInScenarioCalculation: expectBoolean(
      record,
      "useInScenarioCalculation",
      path,
    ),
    contextNote: expectString(record, "contextNote", path),
    impactNote: expectString(record, "impactNote", path),
  };
  assertPercentage(
    snapshot.peakVeryStrongProbabilityPct,
    `${path}.peakVeryStrongProbabilityPct`,
  );
  const observedPeak = Math.max(
    ...snapshot.seasonalOutlook.map(
      (season) => season.veryStrongProbabilityPct,
    ),
  );
  if (snapshot.peakVeryStrongProbabilityPct !== observedPeak) {
    fail(path, "peakVeryStrongProbabilityPct does not match seasonalOutlook");
  }
  return snapshot;
}

function parseSourceFilters(value: unknown, path: string): SourceFilters {
  const record = expectRecord(value, path);
  return {
    frequency: expectOptionalString(record, "frequency", path),
    classification: expectOptionalString(record, "classification", path),
    commodityCode: expectOptionalString(record, "commodityCode", path),
    commodity: expectOptionalString(record, "commodity", path),
    tradeFlow: expectOptionalString(record, "tradeFlow", path),
    measure: expectOptionalString(record, "measure", path),
    reporterIso3:
      record.reporterIso3 === undefined
        ? undefined
        : expectStringArray(record.reporterIso3, `${path}.reporterIso3`),
  };
}

function parseSource(value: unknown, path: string): SourceCatalogEntry {
  const record = expectRecord(value, path);
  return {
    id: expectString(record, "id", path),
    title: expectString(record, "title", path),
    publisher: expectString(record, "publisher", path),
    dataPeriod: expectString(record, "dataPeriod", path),
    url: expectString(record, "url", path),
    usedFor: expectStringArray(record.usedFor, `${path}.usedFor`),
    landingPageUrl: expectOptionalString(record, "landingPageUrl", path),
    downloadUrl: expectOptionalString(record, "downloadUrl", path),
    localInput: expectOptionalString(record, "localInput", path),
    localOutput: expectOptionalString(record, "localOutput", path),
    lastUpdatedDate: expectOptionalString(record, "lastUpdatedDate", path),
    unit: expectOptionalString(record, "unit", path),
    processingNote: expectOptionalString(record, "processingNote", path),
    methodNote: expectOptionalString(record, "methodNote", path),
    limitation: expectOptionalString(record, "limitation", path),
    filters:
      record.filters === undefined
        ? undefined
        : parseSourceFilters(record.filters, `${path}.filters`),
  };
}

function parseSourceCatalog(value: unknown): SourceCatalog {
  const path = "sourceCatalog";
  const record = expectRecord(value, path);
  const sources = expectArray(record.sources, `${path}.sources`).map(
    (source, index) => parseSource(source, `${path}.sources[${index}]`),
  );
  assertUnique(sources, (source) => source.id, `${path}.sources.id`);
  return {
    lastReviewedDate: expectString(record, "lastReviewedDate", path),
    sources,
  };
}

function parseYieldEpisode(
  value: unknown,
  path: string,
): YieldEpisodeDefinition {
  const record = expectRecord(value, path);
  const episode = {
    id: expectString(record, "id", path),
    startYear: expectInteger(record, "startYear", path),
    endYear: expectInteger(record, "endYear", path),
    peakRoni: expectNumber(record, "peakRoni", path),
  };
  if (episode.endYear < episode.startYear) {
    fail(path, "endYear cannot be before startYear");
  }
  return episode;
}

function parseYieldCountry(
  value: unknown,
  path: string,
): CountryYieldEpisodes {
  const record = expectRecord(value, path);
  const episodes: YieldEpisodeAnomaly[] = expectArray(
    record.episodes,
    `${path}.episodes`,
  ).map((item, index) => {
    const itemPath = `${path}.episodes[${index}]`;
    const itemRecord = expectRecord(item, itemPath);
    return {
      episodeId: expectString(itemRecord, "episodeId", itemPath),
      anomalyPct: expectNumber(itemRecord, "anomalyPct", itemPath),
    };
  });
  return {
    iso3: expectString(record, "iso3", path),
    countryName: expectString(record, "countryName", path),
    sourceFirstYear: expectInteger(record, "sourceFirstYear", path),
    sourceLastYear: expectInteger(record, "sourceLastYear", path),
    analysisFirstYear: expectInteger(record, "analysisFirstYear", path),
    analysisLastYear: expectInteger(record, "analysisLastYear", path),
    episodes,
  };
}

function parseYieldEpisodeData(value: unknown): YieldEpisodeData {
  const path = "yieldEpisodeData";
  const record = expectRecord(value, path);
  const methodRecord = expectRecord(record.method, `${path}.method`);
  const episodes = expectArray(record.episodes, `${path}.episodes`).map(
    (episode, index) =>
      parseYieldEpisode(episode, `${path}.episodes[${index}]`),
  );
  const countries = expectArray(record.countries, `${path}.countries`).map(
    (country, index) =>
      parseYieldCountry(country, `${path}.countries[${index}]`),
  );
  assertUnique(episodes, (episode) => episode.id, `${path}.episodes.id`);
  assertUnique(countries, (country) => country.iso3, `${path}.countries.iso3`);
  return {
    method: {
      trend: expectString(methodRecord, "trend", `${path}.method`),
      anomaly: expectString(methodRecord, "anomaly", `${path}.method`),
      yieldUnit: expectString(methodRecord, "yieldUnit", `${path}.method`),
      roniUnit: expectString(methodRecord, "roniUnit", `${path}.method`),
    },
    episodes,
    countries,
  };
}

export function isSimulatorCountry(
  country: CountryData,
): country is SimulatorCountryData {
  return (
    country.simulatorEnabled === true &&
    country.supplierDataAvailable === true &&
    country.tradeDataYear !== null &&
    country.importTonnes !== null &&
    country.hhi !== null &&
    country.effectiveSuppliers !== null &&
    country.topSupplier !== null &&
    country.topSupplierIso3 !== null &&
    country.topSupplierSharePct !== null &&
    country.observedSupplierCount !== null
  );
}

function validateRelationships(
  countries: readonly CountryData[],
  profiles: readonly CountryProfile[],
  suppliers: readonly CountrySupplierData[],
  climateSnapshot: ClimateSnapshot,
  sourceCatalog: SourceCatalog,
  yieldEpisodeData: YieldEpisodeData,
): void {
  const countryByIso3 = new Map(
    countries.map((country) => [country.iso3, country]),
  );
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  for (const country of countries) {
    const profile = profileById.get(country.profileId);
    if (!profile) fail("relationships", `missing profile ${country.profileId}`);
    if (!profile.memberIso3.includes(country.iso3)) {
      fail(
        "relationships",
        `${country.iso3} is not listed in profile ${country.profileId}`,
      );
    }
  }

  for (const profile of profiles) {
    for (const iso3 of profile.memberIso3) {
      const country = countryByIso3.get(iso3);
      if (!country) fail("relationships", `profile references unknown ${iso3}`);
      if (country.profileId !== profile.id) {
        fail("relationships", `${iso3} has a conflicting profile assignment`);
      }
    }
  }

  for (const supplierData of suppliers) {
    const country = countryByIso3.get(supplierData.countryIso3);
    if (!country || !isSimulatorCountry(country)) {
      fail(
        "relationships",
        `supplier data references non-simulator country ${supplierData.countryIso3}`,
      );
    }
    const top = supplierData.suppliers[0];
    if (
      top.supplierIso3 !== supplierData.topSupplierIso3 ||
      top.supplierName !== supplierData.topSupplier
    ) {
      fail("relationships", `top supplier mismatch for ${country.iso3}`);
    }
    const shareTotal = supplierData.suppliers.reduce(
      (total, supplier) => total + supplier.sharePct,
      0,
    );
    if (Math.abs(shareTotal - 100) > 0.01) {
      fail("relationships", `supplier shares do not sum to 100 for ${country.iso3}`);
    }
    if (
      Math.abs(country.importTonnes - supplierData.totalImportTonnes) > 0.001 ||
      Math.abs(country.hhi - supplierData.hhi) > 0.000001
    ) {
      fail("relationships", `country and supplier totals disagree for ${country.iso3}`);
    }
  }

  const supplierIso3 = new Set(suppliers.map((item) => item.countryIso3));
  for (const country of countries.filter(isSimulatorCountry)) {
    if (!supplierIso3.has(country.iso3)) {
      fail("relationships", `missing supplier breakdown for ${country.iso3}`);
    }
  }

  if (!sourceCatalog.sources.some((source) => source.id === climateSnapshot.sourceId)) {
    fail("relationships", `missing climate source ${climateSnapshot.sourceId}`);
  }

  const episodeIds = yieldEpisodeData.episodes.map((episode) => episode.id);
  for (const country of yieldEpisodeData.countries) {
    const countryEpisodeIds = country.episodes.map((episode) => episode.episodeId);
    if (countryEpisodeIds.join("|") !== episodeIds.join("|")) {
      fail("relationships", `yield episodes are misaligned for ${country.iso3}`);
    }
  }
}

export const countries = parseCountries(countriesJson);
export const profiles = parseProfiles(profilesJson);
export const supplierData = parseSuppliers(suppliersJson);
export const climateSnapshot = parseClimateSnapshot(climateSnapshotJson);
export const sourceCatalog = parseSourceCatalog(sourcesJson);
export const yieldEpisodeData = parseYieldEpisodeData(yieldEpisodesJson);

validateRelationships(
  countries,
  profiles,
  supplierData,
  climateSnapshot,
  sourceCatalog,
  yieldEpisodeData,
);

export const simulatorCountries = countries.filter(isSimulatorCountry);

const countryById = new Map(countries.map((country) => [country.id, country]));
const countryByIso3 = new Map(
  countries.map((country) => [country.iso3, country]),
);
const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
const suppliersByCountryIso3 = new Map(
  supplierData.map((item) => [item.countryIso3, item]),
);

export function getCountryById(id: string): CountryData | undefined {
  return countryById.get(id);
}

export function getCountryByIso3(iso3: string): CountryData | undefined {
  return countryByIso3.get(iso3.toUpperCase());
}

export function getProfileById(
  id: CountryProfileId,
): CountryProfile | undefined {
  return profileById.get(id);
}

export function getSupplierData(
  countryIso3: string,
): CountrySupplierData | undefined {
  return suppliersByCountryIso3.get(countryIso3.toUpperCase());
}
