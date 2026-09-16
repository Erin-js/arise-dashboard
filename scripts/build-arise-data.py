#!/usr/bin/env python3
"""Build validated JSON datasets for the ARISE dashboard.

The script keeps raw inputs separate from generated frontend data. It reads:

* data/input/asean-country-baseline.csv
* rice-yields.csv
* RONI_3_Months.csv
* one TradeData*.csv export from UN Comtrade

By default, source CSV files are searched in data/input. Use --source-dir or
the individual file options when the source exports live elsewhere.

Example:
    python scripts/build-arise-data.py \
      --source-dir "C:/path/to/source-csvs"
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable, Sequence


PROFILE_IDS = {
    "C1": "large-gap-thin-stocks",
    "C2": "near-balance-limited-stocks",
    "C3": "surplus-deep-stocks",
    "large-gap-thin-stocks": "large-gap-thin-stocks",
    "near-balance-limited-stocks": "near-balance-limited-stocks",
    "surplus-deep-stocks": "surplus-deep-stocks",
}

YIELD_ANALYSIS_ISO3 = (
    "KHM",
    "IDN",
    "LAO",
    "MYS",
    "MMR",
    "PHL",
    "THA",
    "VNM",
)

YIELD_TREND_START_YEAR = 1990

EL_NINO_EPISODES = (
    ("1991-92", 1991, 1992),
    ("1993", 1993, 1993),
    ("1994-95", 1994, 1995),
    ("1997-98", 1997, 1998),
    ("2002-03", 2002, 2003),
    ("2004-05", 2004, 2005),
    ("2006-07", 2006, 2007),
    ("2009-10", 2009, 2010),
    ("2014-16", 2014, 2016),
    ("2018-19", 2018, 2019),
    ("2023-24", 2023, 2024),
)

BASELINE_COLUMNS = {
    "iso3",
    "country_name",
    "data_year",
    "production_tonnes",
    "domestic_use_tonnes",
    "beginning_stock_tonnes",
    "profile_id",
    "simulator_enabled",
}

TRADE_COLUMNS = {
    "refYear",
    "reporterISO",
    "reporterDesc",
    "flowDesc",
    "partnerISO",
    "partnerDesc",
    "cmdCode",
    "cmdDesc",
    "netWgt",
}

RICE_COLUMNS = {
    "Entity",
    "Code",
    "Year",
    "Rice - Yield (tonnes per hectare)",
}

RONI_SEASONS = (
    "DJF",
    "JFM",
    "FMA",
    "MAM",
    "AMJ",
    "MJJ",
    "JJA",
    "JAS",
    "ASO",
    "SON",
    "OND",
    "NDJ",
)


class PipelineError(RuntimeError):
    """A source-data or validation error that should stop the build."""


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    if not path.is_file():
        raise PipelineError(f"Input file not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise PipelineError(f"CSV has no header: {path}")

        fieldnames = [field.strip() for field in reader.fieldnames if field]
        rows: list[dict[str, str]] = []
        for source_row in reader:
            row = {
                str(key).strip(): (value or "").strip()
                for key, value in source_row.items()
                if key is not None
            }
            if any(row.values()):
                rows.append(row)

    return fieldnames, rows


def require_columns(path: Path, actual: Iterable[str], required: set[str]) -> None:
    missing = sorted(required.difference(actual))
    if missing:
        raise PipelineError(
            f"Missing required columns in {path}: {', '.join(missing)}"
        )


def parse_float(
    value: str,
    *,
    field: str,
    row_label: str,
    allow_blank: bool = False,
) -> float | None:
    if value == "":
        if allow_blank:
            return None
        raise PipelineError(f"Missing {field} for {row_label}")
    try:
        number = float(value)
    except ValueError as error:
        raise PipelineError(
            f"Invalid numeric value for {field} in {row_label}: {value!r}"
        ) from error
    if not math.isfinite(number):
        raise PipelineError(f"Non-finite {field} for {row_label}: {value!r}")
    return number


def parse_int(value: str, *, field: str, row_label: str) -> int:
    number = parse_float(value, field=field, row_label=row_label)
    assert number is not None
    if not number.is_integer():
        raise PipelineError(f"Expected an integer for {field} in {row_label}")
    return int(number)


def parse_bool(value: str, *, field: str, row_label: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    raise PipelineError(
        f"Invalid boolean value for {field} in {row_label}: {value!r}"
    )


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def load_baseline(path: Path) -> list[dict[str, Any]]:
    fields, rows = read_csv(path)
    require_columns(path, fields, BASELINE_COLUMNS)
    if not rows:
        raise PipelineError(f"Baseline CSV has no data rows: {path}")

    baseline: list[dict[str, Any]] = []
    seen_iso3: set[str] = set()

    for row_number, row in enumerate(rows, start=2):
        iso3 = row["iso3"].upper()
        row_label = f"baseline row {row_number} ({iso3 or 'missing ISO3'})"
        if not re.fullmatch(r"[A-Z]{3}", iso3):
            raise PipelineError(f"Invalid ISO3 code in {row_label}: {iso3!r}")
        if iso3 in seen_iso3:
            raise PipelineError(f"Duplicate ISO3 code in baseline: {iso3}")
        seen_iso3.add(iso3)

        name = row["country_name"].strip()
        if not name:
            raise PipelineError(f"Missing country_name in {row_label}")

        profile_code = row["profile_id"].strip()
        if profile_code not in PROFILE_IDS:
            valid = ", ".join(sorted(PROFILE_IDS))
            raise PipelineError(
                f"Unknown profile_id {profile_code!r} in {row_label}. "
                f"Expected one of: {valid}"
            )

        production = parse_float(
            row["production_tonnes"],
            field="production_tonnes",
            row_label=row_label,
        )
        domestic_use = parse_float(
            row["domestic_use_tonnes"],
            field="domestic_use_tonnes",
            row_label=row_label,
        )
        stocks = parse_float(
            row["beginning_stock_tonnes"],
            field="beginning_stock_tonnes",
            row_label=row_label,
        )
        assert production is not None and domestic_use is not None and stocks is not None

        if production < 0 or stocks < 0:
            raise PipelineError(f"Production and stocks cannot be negative in {row_label}")
        if domestic_use <= 0:
            raise PipelineError(f"domestic_use_tonnes must be positive in {row_label}")

        baseline.append(
            {
                "iso3": iso3,
                "countryName": name,
                "dataYear": parse_int(
                    row["data_year"], field="data_year", row_label=row_label
                ),
                "productionTonnes": production,
                "domesticUseTonnes": domestic_use,
                "beginningStockTonnes": stocks,
                "profileCode": profile_code,
                "profileId": PROFILE_IDS[profile_code],
                "simulatorEnabled": parse_bool(
                    row["simulator_enabled"],
                    field="simulator_enabled",
                    row_label=row_label,
                ),
            }
        )

    return baseline


def load_trade(path: Path) -> dict[str, dict[str, Any]]:
    fields, rows = read_csv(path)
    require_columns(path, fields, TRADE_COLUMNS)

    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if row["flowDesc"].strip().lower() != "import":
            continue
        if row["cmdCode"].strip() != "1006":
            continue
        grouped[row["reporterISO"].upper()].append(row)

    if not grouped:
        raise PipelineError(
            f"No annual rice-import records (flow Import, HS 1006) found in {path}"
        )

    summaries: dict[str, dict[str, Any]] = {}
    for iso3, country_rows in grouped.items():
        reporter_names = {row["reporterDesc"] for row in country_rows}
        years = {
            parse_int(row["refYear"], field="refYear", row_label=f"trade {iso3}")
            for row in country_rows
        }
        if len(reporter_names) != 1 or len(years) != 1:
            raise PipelineError(
                f"Trade data for {iso3} must contain one reporter name and one year"
            )

        world_rows = [row for row in country_rows if row["partnerISO"] == "W00"]
        partner_rows = [row for row in country_rows if row["partnerISO"] != "W00"]
        if len(world_rows) != 1:
            raise PipelineError(
                f"Expected exactly one World total for {iso3}; found {len(world_rows)}"
            )

        total_kg = parse_float(
            world_rows[0]["netWgt"], field="netWgt", row_label=f"trade World row {iso3}"
        )
        assert total_kg is not None
        if total_kg <= 0:
            raise PipelineError(f"World import total must be positive for {iso3}")

        suppliers: list[dict[str, Any]] = []
        partner_total_kg = 0.0
        for row in partner_rows:
            partner_iso3 = row["partnerISO"].upper()
            partner_name = row["partnerDesc"]
            net_weight_kg = parse_float(
                row["netWgt"],
                field="netWgt",
                row_label=f"trade {iso3} from {partner_iso3}",
            )
            assert net_weight_kg is not None
            if net_weight_kg < 0:
                raise PipelineError(
                    f"Supplier import weight cannot be negative for {iso3}/{partner_iso3}"
                )
            if net_weight_kg == 0:
                continue
            partner_total_kg += net_weight_kg
            suppliers.append(
                {
                    "supplierIso3": partner_iso3,
                    "supplierName": partner_name,
                    "importTonnes": net_weight_kg / 1000.0,
                    "sharePct": net_weight_kg / total_kg * 100.0,
                }
            )

        relative_gap = abs(partner_total_kg - total_kg) / total_kg
        if relative_gap > 0.001:
            raise PipelineError(
                f"Supplier rows for {iso3} do not reconcile to the World total "
                f"(difference {relative_gap * 100:.4f}%)"
            )

        suppliers.sort(key=lambda item: item["importTonnes"], reverse=True)
        if not suppliers:
            raise PipelineError(f"No supplier rows found for {iso3}")

        hhi = sum((supplier["sharePct"] / 100.0) ** 2 for supplier in suppliers) * 10000.0
        if hhi <= 0:
            raise PipelineError(f"Calculated non-positive HHI for {iso3}")

        summaries[iso3] = {
            "countryIso3": iso3,
            "countryName": next(iter(reporter_names)),
            "tradeDataYear": next(iter(years)),
            "totalImportTonnes": total_kg / 1000.0,
            "hhi": hhi,
            "effectiveSuppliers": 10000.0 / hhi,
            "observedSupplierCount": len(suppliers),
            "topSupplier": suppliers[0]["supplierName"],
            "topSupplierIso3": suppliers[0]["supplierIso3"],
            "topSupplierSharePct": suppliers[0]["sharePct"],
            "suppliers": suppliers,
        }

    return summaries


def solve_three_by_three(matrix: Sequence[Sequence[float]], vector: Sequence[float]) -> list[float]:
    augmented = [list(matrix[row]) + [vector[row]] for row in range(3)]
    for column in range(3):
        pivot = max(range(column, 3), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            raise PipelineError("Quadratic trend fit is singular")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]

        pivot_value = augmented[column][column]
        augmented[column] = [value / pivot_value for value in augmented[column]]
        for row in range(3):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [
                augmented[row][index] - factor * augmented[column][index]
                for index in range(4)
            ]
    return [augmented[row][3] for row in range(3)]


def fit_quadratic_trend(observations: Sequence[tuple[int, float]]) -> dict[int, float]:
    if len(observations) < 3:
        raise PipelineError("At least three observations are required for a quadratic trend")

    mean_year = sum(year for year, _ in observations) / len(observations)
    centered = [(year - mean_year, value) for year, value in observations]
    sum_x = sum(x for x, _ in centered)
    sum_x2 = sum(x**2 for x, _ in centered)
    sum_x3 = sum(x**3 for x, _ in centered)
    sum_x4 = sum(x**4 for x, _ in centered)
    sum_y = sum(value for _, value in centered)
    sum_xy = sum(x * value for x, value in centered)
    sum_x2y = sum(x**2 * value for x, value in centered)

    coefficients = solve_three_by_three(
        (
            (float(len(centered)), sum_x, sum_x2),
            (sum_x, sum_x2, sum_x3),
            (sum_x2, sum_x3, sum_x4),
        ),
        (sum_y, sum_xy, sum_x2y),
    )
    intercept, linear, quadratic = coefficients
    return {
        year: intercept + linear * (year - mean_year) + quadratic * (year - mean_year) ** 2
        for year, _ in observations
    }


def load_yield_observations(path: Path) -> dict[str, dict[str, Any]]:
    fields, rows = read_csv(path)
    require_columns(path, fields, RICE_COLUMNS)

    grouped: dict[str, dict[str, Any]] = {}
    for row_number, row in enumerate(rows, start=2):
        iso3 = row["Code"].upper()
        row_label = f"rice-yields row {row_number} ({iso3})"
        year = parse_int(row["Year"], field="Year", row_label=row_label)
        value = parse_float(
            row["Rice - Yield (tonnes per hectare)"],
            field="Rice - Yield (tonnes per hectare)",
            row_label=row_label,
        )
        assert value is not None
        if value <= 0:
            raise PipelineError(f"Rice yield must be positive in {row_label}")

        country = grouped.setdefault(
            iso3, {"countryName": row["Entity"], "observations": {}}
        )
        if year in country["observations"]:
            raise PipelineError(f"Duplicate rice-yield observation for {iso3} in {year}")
        country["observations"][year] = value

    return grouped


def load_roni(path: Path) -> dict[int, dict[str, float | None]]:
    fields, rows = read_csv(path)
    require_columns(path, fields, {"Year", *RONI_SEASONS})

    history: dict[int, dict[str, float | None]] = {}
    for row in rows:
        year_text = row["Year"].strip()
        if not re.fullmatch(r"\d{4}", year_text):
            # NOAA files repeat their header between decade blocks.
            continue
        year = int(year_text)
        if year in history:
            raise PipelineError(f"Duplicate RONI year: {year}")
        history[year] = {
            season: parse_float(
                row[season],
                field=season,
                row_label=f"RONI {year}",
                allow_blank=True,
            )
            for season in RONI_SEASONS
        }

    if not history:
        raise PipelineError(f"No numeric RONI rows found in {path}")
    return history


def build_yield_episodes(
    yield_history: dict[str, dict[str, Any]],
    roni_history: dict[int, dict[str, float | None]],
) -> dict[str, Any]:
    episode_metadata: list[dict[str, Any]] = []
    for episode_id, start_year, end_year in EL_NINO_EPISODES:
        missing_roni_years = [
            year for year in range(start_year, end_year + 1) if year not in roni_history
        ]
        if missing_roni_years:
            raise PipelineError(
                f"RONI data is missing years for episode {episode_id}: {missing_roni_years}"
            )
        roni_values = [
            value
            for year in range(start_year, end_year + 1)
            for value in roni_history[year].values()
            if value is not None
        ]
        episode_metadata.append(
            {
                "id": episode_id,
                "startYear": start_year,
                "endYear": end_year,
                "peakRoni": max(roni_values),
            }
        )

    countries: list[dict[str, Any]] = []
    for iso3 in YIELD_ANALYSIS_ISO3:
        if iso3 not in yield_history:
            raise PipelineError(f"Rice-yield data is missing required producer {iso3}")
        source = yield_history[iso3]
        source_observations = sorted(source["observations"].items())
        observations = [
            observation
            for observation in source_observations
            if observation[0] >= YIELD_TREND_START_YEAR
        ]
        trend = fit_quadratic_trend(observations)

        annual_anomalies: dict[int, float] = {}
        for year, actual in observations:
            expected = trend[year]
            if expected <= 0:
                raise PipelineError(f"Non-positive fitted yield for {iso3} in {year}")
            annual_anomalies[year] = (actual - expected) / expected * 100.0

        anomalies: list[dict[str, Any]] = []
        for episode in episode_metadata:
            years = range(episode["startYear"], episode["endYear"] + 1)
            values = [annual_anomalies[year] for year in years if year in annual_anomalies]
            expected_count = episode["endYear"] - episode["startYear"] + 1
            if len(values) != expected_count:
                raise PipelineError(
                    f"Rice-yield data for {iso3} does not fully cover {episode['id']}"
                )
            anomalies.append(
                {
                    "episodeId": episode["id"],
                    "anomalyPct": sum(values) / len(values),
                }
            )

        countries.append(
            {
                "iso3": iso3,
                "countryName": source["countryName"],
                "sourceFirstYear": source_observations[0][0],
                "sourceLastYear": source_observations[-1][0],
                "analysisFirstYear": observations[0][0],
                "analysisLastYear": observations[-1][0],
                "episodes": anomalies,
            }
        )

    return {
        "method": {
            "trend": "Country-specific quadratic trend fitted to annual yields from 1990 onward",
            "anomaly": "Mean annual percentage deviation from the fitted trend during each episode",
            "yieldUnit": "tonnes per hectare",
            "roniUnit": "degrees Celsius",
        },
        "episodes": episode_metadata,
        "countries": countries,
    }


def build_countries(
    baseline: list[dict[str, Any]],
    trade: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    countries: list[dict[str, Any]] = []
    baseline_iso3 = {country["iso3"] for country in baseline}

    unexpected_trade = sorted(set(trade).difference(baseline_iso3))
    if unexpected_trade:
        raise PipelineError(
            "Trade data contains reporters absent from the baseline: "
            + ", ".join(unexpected_trade)
        )

    for source in baseline:
        iso3 = source["iso3"]
        production = source["productionTonnes"]
        domestic_use = source["domesticUseTonnes"]
        stocks = source["beginningStockTonnes"]
        production_balance = production - domestic_use
        shortfall = max(domestic_use - production, 0.0)
        trade_summary = trade.get(iso3)

        if source["simulatorEnabled"] and trade_summary is None:
            raise PipelineError(
                f"Simulator is enabled for {iso3}, but no trade data is available"
            )

        country: dict[str, Any] = {
            "id": slugify(source["countryName"]),
            "iso3": iso3,
            "name": source["countryName"],
            "domesticDataYear": source["dataYear"],
            "productionTonnes": production,
            "domesticUseTonnes": domestic_use,
            "selfSufficiencyPct": production / domestic_use * 100.0,
            "productionBalanceTonnes": production_balance,
            "productionShortfallTonnes": shortfall,
            "productionShortfallPct": shortfall / domestic_use * 100.0,
            "beginningStockTonnes": stocks,
            "beginningStockToUsePct": stocks / domestic_use * 100.0,
            "profileCode": source["profileCode"],
            "profileId": source["profileId"],
            "simulatorEnabled": source["simulatorEnabled"],
            "supplierDataAvailable": trade_summary is not None,
            "tradeDataYear": None,
            "importTonnes": None,
            "hhi": None,
            "effectiveSuppliers": None,
            "topSupplier": None,
            "topSupplierIso3": None,
            "topSupplierSharePct": None,
            "observedSupplierCount": None,
        }

        if trade_summary is not None:
            country.update(
                {
                    "tradeDataYear": trade_summary["tradeDataYear"],
                    "importTonnes": trade_summary["totalImportTonnes"],
                    "hhi": trade_summary["hhi"],
                    "effectiveSuppliers": trade_summary["effectiveSuppliers"],
                    "topSupplier": trade_summary["topSupplier"],
                    "topSupplierIso3": trade_summary["topSupplierIso3"],
                    "topSupplierSharePct": trade_summary["topSupplierSharePct"],
                    "observedSupplierCount": trade_summary["observedSupplierCount"],
                }
            )
        countries.append(country)

    return countries


def build_suppliers(
    baseline: list[dict[str, Any]],
    trade: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    name_by_iso3 = {country["iso3"]: country["countryName"] for country in baseline}
    return [
        {
            **summary,
            "countryName": name_by_iso3[iso3],
        }
        for iso3, summary in sorted(trade.items())
    ]


def write_json(path: Path, value: Any) -> None:
    payload = json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(payload, encoding="utf-8", newline="\n")
    temporary.replace(path)


def resolve_source(
    explicit: Path | None,
    source_dir: Path,
    *,
    exact_name: str | None = None,
    glob_pattern: str | None = None,
    label: str,
) -> Path:
    if explicit is not None:
        path = explicit.expanduser().resolve()
        if not path.is_file():
            raise PipelineError(f"{label} file not found: {path}")
        return path

    if exact_name is not None:
        candidate = source_dir / exact_name
        if candidate.is_file():
            return candidate.resolve()

    if glob_pattern is not None:
        matches = sorted(source_dir.glob(glob_pattern))
        if len(matches) == 1:
            return matches[0].resolve()
        if len(matches) > 1:
            names = ", ".join(path.name for path in matches)
            raise PipelineError(
                f"Multiple {label} files found in {source_dir}: {names}. "
                f"Select one with the corresponding command-line option."
            )

    expected = exact_name or glob_pattern or label
    raise PipelineError(
        f"Could not find {label} ({expected}) in {source_dir}. "
        "Use --source-dir or the matching file option."
    )


def parse_args(project_root: Path) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build validated JSON data files for the ARISE dashboard."
    )
    parser.add_argument(
        "--baseline",
        type=Path,
        default=project_root / "data" / "input" / "asean-country-baseline.csv",
        help="Path to the ASEAN country baseline CSV.",
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=project_root / "data" / "input",
        help="Directory containing rice-yields, RONI, and TradeData CSV files.",
    )
    parser.add_argument("--rice-yields", type=Path, help="Path to rice-yields.csv.")
    parser.add_argument("--roni", type=Path, help="Path to RONI_3_Months.csv.")
    parser.add_argument("--trade", type=Path, help="Path to a TradeData CSV export.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=project_root / "data" / "generated",
        help="Directory for generated JSON files.",
    )
    return parser.parse_args()


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    args = parse_args(project_root)
    source_dir = args.source_dir.expanduser().resolve()
    baseline_path = args.baseline.expanduser().resolve()

    rice_path = resolve_source(
        args.rice_yields,
        source_dir,
        exact_name="rice-yields.csv",
        label="rice-yields",
    )
    roni_path = resolve_source(
        args.roni,
        source_dir,
        exact_name="RONI_3_Months.csv",
        label="RONI",
    )
    trade_path = resolve_source(
        args.trade,
        source_dir,
        glob_pattern="TradeData*.csv",
        label="UN Comtrade",
    )

    baseline = load_baseline(baseline_path)
    trade = load_trade(trade_path)
    yield_history = load_yield_observations(rice_path)
    roni_history = load_roni(roni_path)

    countries = build_countries(baseline, trade)
    suppliers = build_suppliers(baseline, trade)
    yield_episodes = build_yield_episodes(yield_history, roni_history)

    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        output_dir / "countries.json": countries,
        output_dir / "suppliers.json": suppliers,
        output_dir / "yield-episodes.json": yield_episodes,
    }
    for path, value in outputs.items():
        write_json(path, value)

    simulator_count = sum(country["simulatorEnabled"] for country in countries)
    supplier_count = sum(item["observedSupplierCount"] for item in suppliers)
    print(f"Built {len(outputs)} ARISE data files in {output_dir}")
    print(f"Countries: {len(countries)} ({simulator_count} simulator-enabled)")
    print(f"Trade reporters: {len(suppliers)} ({supplier_count} supplier records)")
    print(
        "Yield matrix: "
        f"{len(yield_episodes['countries'])} producers x "
        f"{len(yield_episodes['episodes'])} El Nino episodes"
    )
    for path in outputs:
        print(f"- {path.name}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except PipelineError as error:
        print(f"Data build failed: {error}", file=sys.stderr)
        raise SystemExit(2) from error
