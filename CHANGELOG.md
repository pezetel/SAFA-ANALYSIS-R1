# Changelog

## [2.6.0] - 2026-04-10

### Changed — Aircraft Analysis: Period-Based Fleet Weighted Avg + Nσ
- **Aircraft analysis completely reworked** — Replaced the old "1.5× monthly fleet average" fixed rule with a proper **Period-Based Fleet Weighted Avg + Nσ** approach, matching Component and ATA methodology
- **Period Rate per aircraft** — Each aircraft now has a single Period Rate = Total Findings / Total EODs across the entire analysis period (not monthly)
- **Fleet Weighted Average & Sigma** — Computed across all aircraft, weighted by each aircraft's total EOD count. Aircraft with more EODs carry more weight in fleet statistics
- **Sigma slider now affects Aircraft Analysis** — Previously Aircraft was excluded from sigma control; now Threshold = Fleet Wt. Avg + Nσ × Fleet Wt. Sigma, responsive to the sigma multiplier slider
- **Deviation column** — Aircraft (Rate) view shows deviation from threshold for each aircraft (rate - threshold)
- **Fleet summary cards** — Aircraft Period Analysis header now shows Fleet Wt. Avg, Fleet Wt. σ, Threshold, and Aircraft in Alert count

### Changed — Trend Analysis Tab Layout
- **Aircraft Period Analysis moved before Component Heatmap** — Order is now: Sigma Control → Alert Panel → Time Series → Aircraft Period Analysis → Component Heatmap → ATA Heatmap

### Changed — Excel Full Report Export
- **Aircraft (Rate) sheet completely rewritten** — Now exports period-based data matching the dashboard:
  - Columns: Aircraft, Total Findings, Total EODs, Period Rate, Fleet Wt. Avg, Fleet Wt. σ, Threshold (Avg+Nσ), Deviation, Status
  - Summary block at bottom: Analysis Type, Sigma Settings, Fleet stats, Alert count
  - Removed old monthly fleet avg columns and 1.5× fixed threshold logic
- **Alerts sheet updated** — Aircraft alert description now reads "Period-based Fleet Wt. Avg + Nσ" instead of generic label
- **Alert summary improved** — Each alert type (Aircraft, Component, ATA) now shows its threshold method in the summary section

### Changed — Hesaplama Kılavuzu (Calculation Guide)
- **Section 4 (Aircraft) completely rewritten** — Updated from old "1.5× filo ortalaması" to new "Filo Geneli Weighted Avg + Nσ" methodology with:
  - New period-based rate formula explanation
  - Fleet Weighted Average & Sigma calculation steps
  - Full worked example with 6 aircraft showing Period Rate, Fleet Avg, Sigma, Threshold, and Deviation
  - σ sensitivity table showing how TC-SEK alert status changes at 1σ/2σ/3σ/4σ
- **Section 5 (Comparison Table) updated** — Aircraft column now shows:
  - σ slider effect: ✅ Var (was ❌ Yok)
  - Rate time period: "Dönem bazlı (tek rate)" row added
  - Threshold: "Fleet Avg + σ çarpanı × Fleet Sigma" (was "1.5× filo avg")
  - Sigma usage: ✅ Fleet Weighted Sigma (was ❌ Kullanmaz)
- **Section 6 (Sigma) updated** — Now states sigma slider affects all three analyses including Aircraft

### Added — Overview Dashboard
- **Stat card descriptions** — Each overview stat card now shows a small subtitle:
  - Total Records → "Total number of findings"
  - Aircraft Count → "Aircraft with at least 1 finding"
  - ATA Codes → "Unique ATA chapters found"
  - Analysis Period → "Date range of the data"

### Fixed
- **Turkish character encoding** — Fixed `K\u0131lavuzu` unicode escape in dashboard tab rendering as literal `\u` text; now displays proper Turkish "Kılavuzu" character

### Added — Aircraft Period Tracker (Period Analysis)
- **New component: `AircraftPeriodTracker`** — Added to Period Analysis > Period vs Period tab, visible when EOD data is loaded
- **Paired horizontal bar chart** — Each aircraft shows two bars (P1 rate / P2 rate) with threshold markers, making it easy to see at a glance which aircraft exceed the threshold in each period
- **4 status categories** with clickable filter cards:
  - **Both Alert** (red) — Aircraft above threshold in both periods → "Restrict from station"
  - **P1 Only** (amber) — Alert in Period 1 but improved in Period 2
  - **P2 Only** (purple) — New alert appearing in Period 2
  - **Normal** (green) — Below threshold in both periods
- **Per-period fleet stats** — Each period's Fleet Weighted Avg, Fleet σ, and Threshold (Avg + Nσ) calculated independently and displayed in blue/purple info cards
- **Rate change indicator** — Shows trend arrow (↑/↓) and numeric change between P1 and P2 rates for each aircraft
- **Both Alert callout box** — Red highlighted section at bottom listing all persistent problem aircraft with clickable buttons showing rate transition (e.g. "TC-SEK (3.50 → 4.20)")
- **Search bar** — Filter aircraft by registration
- **Click to detail** — Click any aircraft row to open the detail modal with all findings from both periods
- **Sigma-aware** — Uses the global sigma multiplier setting from Trend Analysis

### Changed — Period Analysis: EOD Data Integration
- **EOD records now passed to PeriodComparison** — Dashboard passes `eodRecords` and `sigmaSettings` props to the Period Analysis tab
- **EOD application count on summary cards** — Period 1 Total and Period 2 Total cards now show "X EOD applications" in amber text below the findings count (only visible when EOD data is loaded)

### Fixed
- **Unicode escape rendering** — Fixed `\u03c3`, `\u2192`, `\u2014` literal escapes in AircraftPeriodTracker displaying as raw text instead of σ, →, — characters

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
