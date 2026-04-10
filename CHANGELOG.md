# Changelog

## [2.6.0] - 2025-01-30

### Fixed — General Alert View & Heatmap Consistency
- **Aircraft alerts now match AircraftHeatmap exactly** — `generateAlerts()` aircraft section rewritten to use the same `rate > monthlyFleetAvg × 1.5` logic as `AircraftHeatmap.tsx` and `getAlertLevel()`. Previously it was incorrectly using fleet-wide weighted avg + Nσ (a single threshold for all months), which did not match the heatmap.
- **Each month now has its own fleet avg & threshold for aircraft** — Fleet avg = totalFindings / totalEODs calculated per month. Threshold = fleetAvg × 1.5 per month. Previously all months shared the same weighted avg/sigma values, causing aircraft alert rows to display identical avg/threshold regardless of month.
- **Aircraft alerts no longer use sigma** — `sigma: 0` is set for aircraft alert items since the AircraftHeatmap never used sigma-based thresholds. The sigma slider now correctly only affects Component and ATA alerts.
- **Aircraft rate calculation matches heatmap** — Aircraft rate = aircraftFindings / aircraftEODs (per aircraft per month), matching AircraftHeatmap. Component and ATA rate = findings / totalFleetEODs (per month), matching their respective heatmaps.

### Changed — EODAlertPanel UI Overhaul
- **Removed misleading header stats** — The static "Wt. Avg", "Wt. Sigma", and "Threshold" boxes in the General Alert View header were removed. These showed a single overall fleet weighted sigma that didn't correspond to any specific alert type (not aircraft, not component, not ATA) and never changed when sigma slider was adjusted.
- **Replaced with Alerts by Type breakdown** — Header now shows alert counts per type using Lucide icons (Plane, Cpu, BookOpen) instead of broken unicode emoji escapes.
- **Added info banner** — Blue info box explains that each alert type uses a different threshold method: Aircraft = 1.5× monthly fleet avg (no sigma), Component = own weighted avg + Nσ, ATA = own weighted avg + Nσ.
- **Alert method badge on each row** — Each alert item now displays a small badge showing its threshold method ("1.5x fleet avg" for aircraft, "Avg + 2σ" for component/ATA).
- **Aircraft rows show month-specific values** — Aircraft alert rows display `(fleet avg: X.XX, thr: X.XX)` with values specific to that month. Previously showed the same global weighted avg for every month.
- **Component/ATA rows show own stats** — Display `(own avg: X.XX, σ: X.XX, thr: X.XX)` clarifying these are per-item weighted values.
- **Detail modal labels updated** — Aircraft detail shows "Month Fleet Avg" and "Thr (1.5x avg)". Component/ATA detail shows "Own Wt. Avg", "Own Wt. σ", and "Thr (Avg+Nσ)". Aircraft detail hides the σ stat entirely since it's not used.
- **Subtitle updated** — Now reads: `Aircraft: 1.5× monthly fleet avg · Component: Own Avg + Nσ · ATA: Own Avg + Nσ`

### Fixed — Unicode Rendering
- **Fixed broken emoji rendering** — Replaced all `\u2708\uFE0F`, `\uD83D\uDD27`, `\uD83D\uDCD6` unicode escape sequences with Lucide React icon components (`<Plane />`, `<Cpu />`, `<BookOpen />`). These escapes were rendering as literal text like `\u2708\uFE0F81` instead of emoji in the Alerts by Type box and filter buttons.

### Added
- **Comparison page** (`/comparison`) — Static analysis page comparing user's 2025/1 SAFA JC calculations (Avg + 1σ unweighted) against the platform's aircraft alert method (1.5× fleet avg). Includes sortable table with all 76 aircraft, filter buttons (All/Alert/Normal/Diff), methodology explanation, and key insights.

---

## [2.5.0] - 2025-01-29

### Added
- **ATA Description Lookup** — Imported all 5120 ATA chapter descriptions from `ATA CH.xlsx` into a static JSON lookup table (`lib/ataDescriptions.json`)
- **`lib/ataLookup.ts` helper module** — Provides `getATADescription()` and `formatATAWithDescription()` functions with intelligent fallback (exact match → `XX-YY-00` → `XX-00-00` parent)
- **ATA descriptions in Overview list** — Each ATA code in the ATADistribution list now shows its description inline (e.g. `25-22-00  CABIN EQUIPMENT`)
- **ATA descriptions in Tooltip** — Hovering over pie chart slices shows ATA code + description + findings count
- **ATA descriptions in Detail Modal** — Modal title includes the ATA description (e.g. "ATA 25-22-00 – CABIN EQUIPMENT")

### Changed
- **ATADistribution list layout compacted** — ATA code and description displayed on a single line instead of stacked two-line layout
- **Smaller typography for descriptions** — Description text uses `10px` font size to prevent list from becoming too tall
- **Tooltip resized** — Max width reduced to 200px with smaller font sizes (`10px`–`11px`) for a cleaner look
- **List spacing tightened** — Row padding reduced from `p-2.5` to `py-1.5 px-2`, gap between items reduced from `space-y-1` to `space-y-0.5`
- **Color dots shrunk** — From `w-3 h-3` to `w-2.5 h-2.5` to match the more compact layout
- **Long descriptions truncated** — `truncate` with `max-w-[150px]` prevents overflow on narrow screens

### Fixed
- **Problem Type Distribution X-axis labels disappearing** — Recharts default `interval="preserveEnd"` was hiding labels when space was tight; fixed by setting `interval={0}` to force all labels visible
- **Custom tick renderer for Problem Type chart** — Replaced default XAxis tick with a custom SVG text renderer that rotates labels 30° at 9px font size, preventing overlap
- **Problem Type chart height increased** — `h-64` → `h-72` and XAxis `height={70}` to give rotated labels more room
- **Added missing PAINT_DAMAGE and DENT colors** — `COLORS` map in ProblemTypeChart now includes `PAINT_DAMAGE: '#f97316'` and `DENT: '#fb923c'` so these types no longer fall back to gray

---

## [2.4.0] - 2026-04-08

### Changed
- **Heatmap σ column replaced with Threshold** — In both Component-Time Heatmap and ATA Chapter-Time Heat Map, the σ (sigma) column in Rate view has been removed and replaced with a **Threshold** column
  - Threshold = Weighted Avg + (σ Multiplier × Weighted Sigma)
  - Threshold value updates dynamically when the Sigma Control multiplier is changed from the top control bar
  - Threshold column styled with red tones (bg-red-50, border-red-200, text-red-800) to clearly distinguish from the Avg column
  - Tooltip hover text updated to show threshold instead of raw sigma value
  - Legend/info boxes updated: "Normal: ≤ Threshold" and "Alert: > Threshold" replacing sigma formula references
  - Subtitle text updated to show "Threshold: Avg + Nσ" instead of "Avg + Nσ threshold"
- **μ symbol removed from all displays** — All occurrences of the μ (mu) symbol replaced with human-readable "Avg" or "Wt. Avg" labels across the entire codebase (heatmaps, tooltips, chart labels, alert panels, info popovers)
- **SigmaControl redesigned as compact widget** — Removed old filter-style sigma input; replaced with a sleek inline widget featuring:
  - "Sigma (σ) Multiplier" label with indigo icon badge
  - Horizontal volume-bar style selector (1, 1.5, 2, 2.5, 3, 3.5, 4) with ascending bar heights
  - Filled bars up to selected value for visual feedback
  - Current threshold indicator (e.g. "Alert at 2σ")
  - ℹ️ info button that reveals/hides a detailed explanation popover describing weighted average, weighted sigma, and alert logic
- **"Watch" alert level removed entirely** — Only two levels remain: `normal` and `alert`
  - Removed `watchMultiplier` from `DEFAULT_SIGMA` in dashboard page
  - Removed `watchMultiplier` validation from localStorage persistence logic
  - Removed yellow "Watch" color branch from `AircraftHeatmap` rate view (`getRateColor`)
  - Updated Aircraft heatmap legend: removed "Watch: > month avg & ≤ 1.5×" row; Normal now shows "≤ 1.5× month avg", Alert shows "> 1.5× month avg"
  - `SigmaSettings` type confirmed to only contain `{ multiplier: number }` — no watch-related fields
  - `getAlertLevel()` and `getAlertLevelSigma()` return type is `'normal' | 'alert'` only
- **Aircraft heatmap kept as monthly-average-based** — No sigma props passed; continues to use `getAlertLevel()` which compares each aircraft's rate to that month's fleet-wide average (alert threshold: > 1.5× monthly fleet avg)
- **Component heatmap uses sigma-based thresholds** — Each component's own weighted Avg + Nσ across all months via `getAlertLevelSigma()`, controlled by SigmaControl multiplier
- **ATA heatmap uses sigma-based thresholds** — Each ATA chapter's own weighted Avg + Nσ across all months via `getAlertLevelSigma()`, controlled by SigmaControl multiplier
- **TrendChart uses sigma-based thresholds** — Alert reference line and dot coloring use overall weighted Avg + Nσ, responsive to SigmaControl multiplier
- **EODAlertPanel uses sigma-based thresholds** — All alert generation (aircraft, component, ATA) uses `getAlertLevelSigma()` with the selected sigma multiplier

### Removed
- `watchMultiplier` property from all sigma settings defaults and localStorage parsing
- "Watch" level badge rendering and yellow color mapping from all components
- Dead code branch `if (level === 'watch')` in `AircraftHeatmap.tsx`
- **σ (sigma) column** from Component Heatmap and ATA Heatmap rate view — replaced by computed Threshold column

---

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
