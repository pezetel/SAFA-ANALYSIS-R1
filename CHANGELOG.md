# Changelog

## [2.2.0] - 2025-01-27

### Added
- **EOD (Engineering Order) Integration** — Upload EOD Excel as optional 2nd file to support trend analysis with normalized finding rates
- **EOD-Based Alert System** — New `EODAlertPanel` component in Trend Analysis tab with 3-level alerts (🟢 Normal, 🟡 Watch, 🔴 Alert)
- **Finding Rate Formula** — `Findings / EOD Applications` per month, comparing against average to detect anomalies
- **Rate View (F/EOD) toggle** on all three heatmaps (Aircraft, Component, ATA Chapter)
- **Per-component average rate** — Component heatmap compares each component to its own historical average (PLACARD vs ENGINE are not mixed)
- **Per-ATA average rate** — ATA heatmap compares each ATA chapter to its own historical average
- **Fleet-wide average rate** — Aircraft heatmap compares each aircraft against the entire fleet average
- **Avg Rate column** visible in rate mode for Component and ATA heatmaps
- **Search/filter bar** on all three heatmaps — quickly find aircraft (e.g. "SEK"), components (e.g. "SEAT"), or ATA chapters (e.g. "25", "Landing Gear")
- **Show 10 / 20 / 50 / All** pagination controls on all heatmaps — no more forced Top 10 only
- **ATA 2-digit grouping** — ATA heatmap now groups by 2-digit chapter code (25-22-00 + 25-60-00 → ATA 25) with chapter names (e.g. "25 - Equipment/Furnishings")
- **ATA chapter name labels** — common ATA codes display their human-readable names

### Changed
- `minEODThreshold` changed from `2` to `1` — in aviation EOD is typically applied once per aircraft per month, threshold of 2 was filtering out valid data
- Dashboard now loads EOD data from `localStorage` and passes `eodRecords` prop to all Trend Analysis child components
- Time Series chart reference line labels repositioned — "Avg" and "1.5× Avg" badges now sit just outside the plot area (right of Y-axis) without overflowing the card container
- Chart margin adjusted (`margin.right: 60`) to accommodate reference line labels cleanly
- Heatmap subtitle now shows count context (e.g. "Top 10 of 23 aircraft", "All 15 components, filtered by SEAT")

### Fixed
- EOD data was being processed and stored in localStorage but never loaded into the dashboard — now properly hydrated with Date parsing
- `EODAlertPanel` was defined but never rendered — now shown at top of Trend Analysis tab when EOD data exists
- Component and ATA heatmaps had no EOD rate support — now fully integrated with rate toggle and alert coloring
- ATA heatmap was using 6-digit ATA codes for rate calculation, fragmenting data — now uses 2-digit grouping for meaningful averages
- Time Series chart "Avg Rate" label was overflowing to the right outside the card — repositioned with custom SVG labels

---

## [2.1.0] - Previous Release

- Initial SAFA trend analysis platform
- Excel upload and processing
- Dashboard with Overview, Trend Analysis, Period Analysis, Detailed Data tabs
- Filter panel with date range, aircraft, ATA, problem type, component filters
- Time Series chart, Component/Aircraft/ATA heatmaps
- Period comparison analysis
- Data table with search and export to Excel
