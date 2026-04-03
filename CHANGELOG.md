# Changelog

## [2.3.0] - 2025-01-28

### Added
- **General Alert View** — Alert panel renamed to "General Alert View" with clear section identity in Trend Analysis tab
- **Alert Detail Modal** — Click any alert/watch item in the General Alert View to open a full detail modal showing all matching findings
  - Stats header: Findings, EODs, Rate, Avg Rate, Ratio displayed prominently
  - Searchable findings table with W/O, Date, Aircraft, ATA, Problem Type, Component, Description
  - Pagination (First/Previous/Next/Last) and Excel export per alert item
- **Quick Date Range Buttons** — Filter panel now has quick-select buttons: Last 1M, Last 3M, Last 6M, Last 12M, YTD, Full Range
  - Based on the latest date in the dataset
  - Active selection highlighted in blue
  - Selected date range shown as amber badge in filter header
  - "Clear dates" button for quick reset
  - Manual date inputs still available below
- **Full Report Excel Export** — New "Full Report" button (blue) in header exports multi-sheet Excel:
  - Time Series: monthly findings, EODs, rate + summary stats
  - Component (Count): component × month heatmap with totals
  - Component (Rate): rate values + Avg Rate + Alert Level columns
  - Aircraft (Count): aircraft × month heatmap with totals
  - Aircraft (Rate): Fleet Avg row + rate values + Max Alert column
  - ATA (Count): ATA × month heatmap with chapter names + totals
  - ATA (Rate): rate values + Avg Rate + Alert Level + EOD Total row
  - Alerts: all alert/watch items with level, type, name, month, findings, EODs, rate, avg, ratio + summary
  - Raw Data: all filtered finding records
- **EOD Period Filtering** — Date range and aircraft filters now also filter EOD records, so all rate calculations, averages, and alerts reflect the selected period
  - Header shows filtered EOD count when filters are active
  - Aircraft type filter (NG/MAX) filters EOD records by aircraft too

### Changed
- **Alert Panel averages now match heatmaps exactly:**
  - Aircraft alerts: compare each aircraft's rate to that month's fleet-wide average (totalFindings ÷ totalEODs), matching AircraftHeatmap
  - Component alerts: per-component own average across ALL months where rate ≥ 0 (including months with 0 findings but EOD exists), matching ComponentHeatmap
  - ATA alerts: per-ATA own average across ALL months where rate ≥ 0 (including months with 0 findings but EOD exists), matching ATAHeatmap
- **Component Heatmap responsive width** — Removed fixed `w-16`/`w-40` cell widths, table now uses `w-full` to fill container; fewer months = larger cells that fill the available space
- **Export buttons reorganized** — "Full Report" (blue, multi-sheet) and "Raw Data" (green, single sheet) clearly separated

### Fixed
- Alert panel was using a single global average for all components/ATAs instead of per-item averages — now each component/ATA uses its own average matching the heatmap calculation
- Alert panel was using a single global average for aircraft instead of per-month fleet average — now uses monthly fleet average matching AircraftHeatmap
- EOD records were not filtered when date range or aircraft filters were applied — TrendChart, heatmaps, and alert panel all received unfiltered EOD data causing incorrect rates for selected periods
- Component heatmap cells did not expand to fill container when fewer months were selected (e.g. Last 3M showed tiny cells with empty space)

---

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
