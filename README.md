# ✈️ SAFA Trend Analysis Platform

Comprehensive trend analysis and reporting system for aircraft SAFA (Safety Assessment of Foreign Aircraft) findings with EOD-based alert monitoring and sigma-based statistical thresholds.

![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.5.0-orange)

## 🎯 Features

### 📤 Excel Upload & Data Processing
- Drag-and-drop or click-to-select XLSX/XLS file upload
- **Dual file support**: SAFA findings (required) + EOD data (optional)
- Automatic data validation and cleaning
- Smart cleaning of EOD numbers and standard patterns
- Flexible column mapping (W/O Date, ATA, A/C, Description)

### 📊 Dashboard & Visualization
- **Statistics Cards**: Total findings, aircraft count, ATA chapters, analysis period
- **ATA Distribution**: Pie chart showing system category distribution with ATA chapter descriptions
- **Problem Type Chart**: Bar chart of problem types (Missing, Damaged, etc.) with rotated labels for readability
- **All Findings by Component**: Full component listing with finding type breakdown as color-coded tags
- **Time Series Chart**: Monthly finding count trends with EOD-based finding rate overlay and sigma-based alert threshold line
- **Aircraft Heatmap**: Aircraft × Time density map with rate view (F/EOD)
- **ATA Heatmap**: ATA Chapter × Time density map with rate view (F/EOD) and threshold column
- **Component Heatmap**: Component × Time density map with rate view (F/EOD) and threshold column

### 🚨 General Alert View
- **2-level alert system**: 🟢 Normal, 🔴 Alert (rate exceeds threshold)
- **Sigma-based thresholds**: Alert threshold = Weighted Avg + (σ Multiplier × Weighted Sigma)
- **Three alert categories**:
  - **Aircraft**: Each aircraft's rate compared to that month's fleet-wide weighted average + Nσ
  - **Component**: Each component's rate compared to its own weighted average + Nσ across all active months
  - **ATA**: Each ATA chapter's rate compared to its own weighted average + Nσ across all active months
- **Alert averages match heatmaps exactly** — same calculation logic used everywhere
- **Clickable alert items** — click any alert row to open detail modal with:
  - Stats header: Findings, EODs, Rate, Avg Rate, Ratio
  - Searchable findings table with pagination
  - Excel export per alert item
- **Filter by type**: All, Aircraft, Component, ATA
- Months with no EOD data excluded from average calculations

### 🎛️ Sigma Control
- **Compact widget** with visual volume-bar style selector
- Adjustable σ multiplier: 0, 1, 1.5, 2, 2.5, 3, 3.5, 4
- Filled bars up to selected value for visual feedback
- Current threshold indicator (e.g. "Alert at 2σ")
- ℹ️ info button with detailed explanation popover describing weighted average, weighted sigma, and alert logic
- Controls alert sensitivity across all heatmaps, trend chart, and alert panel simultaneously

### 🔍 Interactive Detail View
- Click on any chart, list item, or heatmap cell to view details
- Modal window with filtered records
- Live search and pagination
- Excel export from detail view

### 🎛️ Advanced Filters
- **Quick Date Range Buttons**: Last 1M, Last 3M, Last 6M, Last 12M, YTD, Full Range
  - Based on the latest date in the dataset
  - Active selection highlighted in blue
  - Selected range shown as amber badge in filter header
- Manual date range selection (Start Date / End Date)
- Aircraft type filter (B737-NG / B737-MAX)
- Aircraft multi-select with search
- ATA chapter selection with search
- Problem type filtering
- Component filtering with search
- Active filter counter
- **EOD records also filtered** — date range and aircraft filters apply to EOD data too, so all rates and averages reflect the selected period

### 📅 Period Comparison
- Compare two custom date periods side by side
- Quick select buttons (First 6 vs Last 6 months, 2024 vs 2025, Q1 vs Q2, Q3 vs Q4)
- Most increased / decreased problems
- Component comparison bar chart
- Fleet normalization (per-aircraft averages)

### 💾 Export & Reporting

#### Full Report (Multi-Sheet Excel)
Click **"Full Report"** button to export all data as a comprehensive multi-sheet Excel file:

| Sheet | Content |
|-------|--------|
| **Time Series** | Monthly findings, EODs, rate + summary (total, avg, highest, lowest, avg rate) |
| **Component (Count)** | Component × Month count heatmap + Total column |
| **Component (Rate)** | Rate values + Avg Rate + Alert Level column (🔴/🟢) |
| **Aircraft (Count)** | Aircraft × Month count heatmap + Total column |
| **Aircraft (Rate)** | Fleet Avg row + rate values + Max Alert column |
| **ATA (Count)** | ATA × Month count with chapter names + Total column |
| **ATA (Rate)** | Rate values + Avg Rate + Alert Level + EOD Total row |
| **Alerts** | All alert items with level, type, name, month, findings, EODs, rate, avg, ratio + summary |
| **Raw Data** | All filtered finding records |

#### Raw Data Export
Click **"Raw Data"** button for a single-sheet Excel with all filtered records.

#### Detail Modal Export
Export filtered records from any detail modal view.

## 🚀 Installation

### Requirements
- Node.js 18+ or 20+
- pnpm (or npm/yarn)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/safa-trend-analysis.git
cd safa-trend-analysis
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
# or
yarn install
```

3. **Start the development server**
```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 📦 Production Build

```bash
pnpm build
pnpm start
```

## 🌐 Deploy to Vercel

### Automatic Deploy (Recommended)
1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on every commit

### Manual Deploy
```bash
npm i -g vercel
vercel
```

## 📝 Usage

### 1. Excel Format

#### SAFA Findings File (Required)

Your Excel file should contain the following columns:

| Column Name | Description | Example |
|-------------|-------------|----------|
| W/O Number | Work order number | 1292209 |
| W/O Date | Date | 1.05.2025 or 01.05.2025 |
| ATA | ATA code | 25-22-00 |
| A/C | Aircraft tail number | TC-SOH |
| Description | Finding description | FINDING (NRC) DOCUMENT EOD-B737-00-0001-R00... |

**Note:** Column names are flexible — the system also accepts these alternatives:
- Date: `w/o date`, `wo date`, `date`, `tarih`
- Aircraft: `a/c`, `ac`, `aircraft`, `registration`
- Description: `description`, `aciklama`, `finding`, `desc`

#### EOD File (Optional)

Upload an EOD Excel file to enable rate-based analysis and alerts:

| Column Name | Description | Example |
|-------------|-------------|----------|
| Event | EOD event number | EOD-B737-00-0001 |
| A/C | Aircraft tail number | TC-SOH |
| Perf. Date | Performance date | 15.06.2024 |
| Event Status | Status | OPEN / CLOSED |
| Work Order | Work order | 1234567 |

### 2. Data Upload

1. On the home page, upload your **SAFA findings Excel file** (required)
2. Optionally upload an **EOD Excel file** to enable rate analysis
3. The system will automatically process the data and redirect to the dashboard

### 3. Dashboard Usage

#### Overview Tab
- Click on **charts and lists** to view details
- See all components with their finding type breakdown
- ATA distribution pie chart shows ATA descriptions on hover and in lists
- Analyze distribution by problem type

#### Trend Analysis Tab
- **Sigma Control** at the top — adjust σ multiplier to control alert sensitivity
- **General Alert View** below — click any alert item to see findings detail
- **Quick Date Range** buttons for fast period selection
- Track changes over time with the monthly trend chart (with rate overlay and sigma threshold line when EOD loaded)
- Toggle **Count / Rate (F/EOD)** on all heatmaps
- Heatmaps show **Threshold** column in rate view (Avg + Nσ)
- Click **heatmap cells** to view details for that combination
- Search and paginate through all heatmaps
- All rates, averages, and thresholds update when filters or sigma multiplier change

#### Period Analysis Tab
- Use quick select buttons or enter custom date ranges
- Compare two periods side by side
- See which problems increased or decreased

#### Detailed Data Tab
- View all records in table format
- Click column headers to sort
- Use live search to find records
- Export to Excel

### 4. Filters

- **Quick Date Range**: Last 1M / 3M / 6M / 12M / YTD / Full Range
- **Manual Date Range**: Select start and end dates
- **Aircraft Type**: Filter by B737-NG or B737-MAX fleet
- **Aircraft**: Multi-select with search
- **ATA Chapter**: Filter by system categories with search
- **Problem Type**: MISSING, DAMAGED, LOOSE, etc.
- **Component**: Filter by component with search
- **Clear**: Reset all filters

> **Note**: Date range and aircraft filters also apply to EOD records, ensuring all rate calculations reflect the selected period.

## 🧹 Data Cleaning

The system automatically cleans the following noise from descriptions:

- ✅ `FINDING (NRC) DOCUMENT EOD-B737-00-0001-R00PARAG NO B01` → Cleaned
- ✅ `PARAG NO B06`, `PARAGRAPH B12` → Cleaned
- ✅ `DURING PERFORM WO:1159857` → Cleaned
- ✅ `W/O 1234567`, `TC-SOH` references → Cleaned
- ✅ `NRC`, `NRC1`, `NRC2` → Parsed as severity
- ✅ Common typos: `FOND` → `FOUND`, `NOR WORKING` → `NOT WORKING`, `MISISING` → `MISSING`

## 🎨 Component Categories

The system automatically recognizes and groups the following components:

| Component | Description |
|-----------|-------------|
| `LG_OIL_CHARGING_VALVE` | Landing gear oil charging valve (incl. typo variants) |
| `BONDING` | Bonding wires and jumper wires |
| `LANYARD_RING` | Lanyard rings (incl. apostrophe variants) |
| `HORIZONTAL_STABILIZER` | Horizontal stabilizer |
| `OVERHEAD_BIN` | Overhead stowage bins |
| `BIN_STOPPER` | Bin / door stoppers |
| `TRAY_TABLE` | Tray tables |
| `SEAT_BELT` | Seat belts and safety harnesses |
| `LIGHT` | Reading lights, flood lights, light lenses |
| `LIFE_VEST` | Life vests |
| `PLACARD` | Placards |
| `LAVATORY` | Lavatories |
| `GALLEY` | Galleys |
| `SUNSHADE` | Window shades / sunshades |
| `CURTAIN` | Curtains |
| `OXYGEN` | Oxygen bottles and systems |
| `MIRROR` | Mirrors |
| `CARPET` | Carpets and floor mats |
| `CARGO_NETS` | Cargo nets |
| `CARGO_TAPES` | Cargo compartment tapes (sidewall, lining, panel) |
| `ANTENNA` | Antennas |
| `KRUGER_FLAP` | Kruger flaps |
| `SLAT` | Slats |
| `FLAP` | Flaps |
| `ENGINE` | Engines, cowls, fan blades, pylons |
| `LANDING_GEAR` | Landing gear and landing lights |
| `WATER_SYSTEM` | Water service and potable water systems |
| `HINGE` | Hinges |
| `LATCH` | Latches |
| `FLOOR_PANEL` | Floor panels |
| `CEILING_PANEL` | Ceiling panels |
| `DOOR_PANEL` | Door panels |
| `SIDE_PANEL` | Side / wall panels |
| `TRIM_PANEL` | Trim panels |
| `PANEL` | Generic panels and trim |
| `SEAT` | Passenger seats, attendant seats |
| `DOOR` | Doors |
| `OTHER` | Unclassified |

## 🔧 Problem Types

| Type | Matched Keywords |
|------|------------------|
| `DENT` | Dent, dented |
| `PAINT_DAMAGE` | Paint damage, paint damaged, painting damage |
| `MISSING` | Missing, miss |
| `DAMAGED` | Damaged, damage, crack, broken, torn, worn |
| `LOOSE` | Loose, not fixed |
| `INOPERATIVE` | Inop, not working, not illuminate, not functioning, faulty |
| `CLEANLINESS` | Dirty |
| `ADJUSTMENT` | Adjustment, out of adjustment |
| `OTHER` | Unclassified |

## 📐 Rate & Alert Calculation Logic

### Finding Rate
```
Rate = Number of Findings / Number of EOD Applications (per month)
```

### Weighted Average & Weighted Sigma
```
Weighted Avg = Σ(EODs_i × Rate_i) / Σ(EODs_i)
Weighted Sigma = √[ Σ(EODs_i × (Rate_i − Weighted Avg)²) / Σ(EODs_i) ]
```
Months with more EOD applications carry more weight in the average and sigma calculations.

### Alert Threshold
```
Threshold = Weighted Avg + (σ Multiplier × Weighted Sigma)
```
The σ multiplier is adjustable via the Sigma Control widget (default: 2).

### Alert Levels
| Level | Condition |
|-------|----------|
| 🟢 **Normal** | Rate ≤ Threshold |
| 🔴 **Alert** | Rate > Threshold |

### Average Calculation by Category

| Category | Threshold Baseline | Matches |
|----------|-------------------|----------|
| **Aircraft** | Fleet-wide weighted avg + Nσ across all months | AircraftHeatmap |
| **Component** | Per-component own weighted avg + Nσ across all months where EOD exists | ComponentHeatmap |
| **ATA** | Per-ATA own weighted avg + Nσ across all months where EOD exists | ATAHeatmap |

> Months with no EOD data are excluded from average calculations (not counted as zero).

## 🏗️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Excel Processing**: xlsx
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel

## 📂 Project Structure

```
safa-trend-analysis/
├── app/
│   ├── api/
│   │   ├── upload/          # Excel upload endpoint
│   │   ├── process/         # Data processing endpoint
│   │   └── analyze/         # Analysis endpoint
│   ├── dashboard/           # Dashboard page
│   ├── layout.tsx
│   ├── page.tsx             # Home page (with version display)
│   └── globals.css
├── components/
│   ├── FileUpload.tsx       # Excel upload (SAFA + EOD)
│   ├── DashboardStats.tsx   # Statistics cards
│   ├── TrendChart.tsx       # Time series chart with rate overlay & sigma threshold
│   ├── AircraftHeatmap.tsx  # Aircraft heatmap with rate toggle
│   ├── ATAHeatmap.tsx       # ATA chapter heatmap with rate toggle & threshold column
│   ├── ComponentHeatmap.tsx # Component heatmap with rate toggle & threshold column
│   ├── EODAlertPanel.tsx    # General Alert View with detail modal
│   ├── SigmaControl.tsx     # Sigma multiplier widget with visual bar selector
│   ├── ATADistribution.tsx  # Pie chart with ATA descriptions
│   ├── ProblemTypeChart.tsx # Bar chart with rotated labels
│   ├── TopProblems.tsx      # All findings by component
│   ├── PeriodComparison.tsx # Period comparison analysis
│   ├── FilterPanel.tsx      # Filtering UI with quick date buttons
│   ├── DataTable.tsx        # Data table with sorting
│   └── DetailModal.tsx      # Modal for record details
├── lib/
│   ├── ataDescriptions.json # 5120 ATA chapter descriptions lookup
│   ├── ataLookup.ts         # ATA description helper (getATADescription, formatATAWithDescription)
│   ├── dataProcessor.ts     # Data cleaning & processing
│   ├── eodProcessor.ts      # EOD processing, weighted stats, rates & alert generation
│   ├── excelExporter.ts     # Full report multi-sheet Excel export
│   ├── types.ts             # TypeScript types
│   └── version.ts           # App version
├── CHANGELOG.md             # Version history
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About

This project was born from the need for trend analysis in aviation maintenance operations.

## 🐛 Bug Reporting

If you find a bug or have a suggestion, please [open an issue](https://github.com/yourusername/safa-trend-analysis/issues).

---

**Note**: This project can quickly analyze thousands of SAFA records. It is optimized for performance.
