export const COUNTRY_PROFILE_IDS = [
  "large-gap-thin-stocks",
  "near-balance-limited-stocks",
  "surplus-deep-stocks",
] as const;

export type CountryProfileId = (typeof COUNTRY_PROFILE_IDS)[number];
export type ProfileColor = "coral" | "amber" | "green";

export interface CountryData {
  id: string;
  iso3: string;
  name: string;
  domesticDataYear: number;
  productionTonnes: number;
  domesticUseTonnes: number;
  selfSufficiencyPct: number;
  productionBalanceTonnes: number;
  productionShortfallTonnes: number;
  productionShortfallPct: number;
  beginningStockTonnes: number;
  beginningStockToUsePct: number;
  profileCode: string;
  profileId: CountryProfileId;
  simulatorEnabled: boolean;
  supplierDataAvailable: boolean;
  tradeDataYear: number | null;
  importTonnes: number | null;
  hhi: number | null;
  effectiveSuppliers: number | null;
  topSupplier: string | null;
  topSupplierIso3: string | null;
  topSupplierSharePct: number | null;
  observedSupplierCount: number | null;
}

export type SimulatorCountryData = CountryData & {
  simulatorEnabled: true;
  supplierDataAvailable: true;
  tradeDataYear: number;
  importTonnes: number;
  hhi: number;
  effectiveSuppliers: number;
  topSupplier: string;
  topSupplierIso3: string;
  topSupplierSharePct: number;
  observedSupplierCount: number;
};

export interface CountryProfile {
  code: string;
  id: CountryProfileId;
  name: string;
  color: ProfileColor;
  memberIso3: readonly string[];
  priority: string;
  actions: readonly string[];
  alertSignal: string;
}

export interface SupplierShare {
  supplierIso3: string;
  supplierName: string;
  importTonnes: number;
  sharePct: number;
}

export interface CountrySupplierData {
  countryIso3: string;
  countryName: string;
  tradeDataYear: number;
  totalImportTonnes: number;
  hhi: number;
  effectiveSuppliers: number;
  observedSupplierCount: number;
  topSupplier: string;
  topSupplierIso3: string;
  topSupplierSharePct: number;
  suppliers: readonly SupplierShare[];
}

export interface ClimateSeasonOutlook {
  season: string;
  period: string;
  elNinoProbabilityPct: number;
  veryStrongProbabilityPct: number;
}

export interface ClimateSnapshot {
  issuedDate: string;
  issuedMonth: string;
  status: string;
  headline: string;
  period: string;
  peakVeryStrongProbabilityPct: number;
  peakSeason: string;
  seasonalOutlook: readonly ClimateSeasonOutlook[];
  sourceId: string;
  isLive: boolean;
  useInScenarioCalculation: boolean;
  contextNote: string;
  impactNote: string;
}

export interface SourceFilters {
  frequency?: string;
  classification?: string;
  commodityCode?: string;
  commodity?: string;
  tradeFlow?: string;
  measure?: string;
  reporterIso3?: readonly string[];
}

export interface SourceCatalogEntry {
  id: string;
  title: string;
  publisher: string;
  dataPeriod: string;
  url: string;
  usedFor: readonly string[];
  landingPageUrl?: string;
  downloadUrl?: string;
  localInput?: string;
  localOutput?: string;
  lastUpdatedDate?: string;
  unit?: string;
  processingNote?: string;
  methodNote?: string;
  limitation?: string;
  filters?: SourceFilters;
}

export interface SourceCatalog {
  lastReviewedDate: string;
  sources: readonly SourceCatalogEntry[];
}

export interface YieldEpisodeDefinition {
  id: string;
  startYear: number;
  endYear: number;
  peakRoni: number;
}

export interface YieldEpisodeAnomaly {
  episodeId: string;
  anomalyPct: number;
}

export interface CountryYieldEpisodes {
  iso3: string;
  countryName: string;
  sourceFirstYear: number;
  sourceLastYear: number;
  analysisFirstYear: number;
  analysisLastYear: number;
  episodes: readonly YieldEpisodeAnomaly[];
}

export interface YieldEpisodeData {
  method: {
    trend: string;
    anomaly: string;
    yieldUnit: string;
    roniUnit: string;
  };
  episodes: readonly YieldEpisodeDefinition[];
  countries: readonly CountryYieldEpisodes[];
}

export interface ScenarioCountryInput {
  importTonnes: number;
  topSupplierSharePct: number;
}

export interface ScenarioResult {
  disruptionPct: number;
  topSupplierImportsTonnes: number;
  importsExposedTonnes: number;
  shareOfTotalImportsExposedPct: number;
  remainingImportsTonnes: number;
}
