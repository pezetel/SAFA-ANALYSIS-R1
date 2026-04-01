# ✈️ SAFA Trend Analysis Platform

Comprehensive trend analysis and reporting system for aircraft SAFA (Safety Assessment of Foreign Aircraft) findings.

![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.1-orange)

## 🎯 Features

### 📤 Excel Upload & Data Processing
- Drag-and-drop or click-to-select XLSX/XLS file upload
- Automatic data validation and cleaning
- Smart cleaning of EOD numbers and standard patterns
- Flexible column mapping (W/O Date, ATA, A/C, Description)

### 📊 Dashboard & Visualization
- **Statistics Cards**: Total findings, aircraft count, ATA chapters, analysis period
- **ATA Distribution**: Pie chart showing system category distribution
- **Problem Type Chart**: Bar chart of problem types (Missing, Damaged, etc.)
- **All Findings by Component**: Full component listing with finding type breakdown as color-coded tags
- **Time Series Chart**: Monthly finding count trends
- **Aircraft Heatmap**: Aircraft × Time density map
- **ATA Heatmap**: ATA Chapter × Time density map
- **Component Heatmap**: Component × Time density map

### 🔍 Interactive Detail View
- Click on any chart or list item to view details
- Modal window with filtered records
- Live search and pagination
- Excel export from detail view

### 🎛️ Advanced Filters
- Date range selection
- Aircraft type filter (B737-NG / B737-MAX)
- Aircraft multi-select with search
- ATA chapter selection with search
- Problem type filtering
- Component filtering with search
- Active filter counter

### 📅 Period Comparison
- Compare two custom date periods side by side
- Quick select buttons (First 6 vs Last 6 months, 2024 vs 2025, Q1 vs Q2, Q3 vs Q4)
- Most increased / decreased problems
- Component comparison bar chart

### 💾 Export & Reporting
- Excel export (all data or filtered)
- Detail modal export
- Clean, analyzed data output

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

### 2. Data Upload

1. On the home page, click the "Drag and drop your Excel file or click here" area
2. Select your XLSX or XLS file
3. The system will automatically process the data and redirect to the dashboard

### 3. Dashboard Usage

#### Overview Tab
- Click on **charts and lists** to view details
- See all components with their finding type breakdown
- Analyze distribution by problem type

#### Trend Analysis Tab
- Track changes over time with the monthly trend chart
- Click **heatmap cells** to view details for that aircraft/ATA + month combination
- Discover which aircraft or systems had the most findings in which months

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

- **Aircraft Type**: Filter by B737-NG or B737-MAX fleet
- **Date Range**: Select start and end dates
- **Aircraft**: Multi-select with search
- **ATA Chapter**: Filter by system categories with search
- **Problem Type**: MISSING, DAMAGED, LOOSE, etc.
- **Component**: Filter by component with search
- **Clear**: Reset all filters

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
│   ├── FileUpload.tsx       # Excel upload component
│   ├── DashboardStats.tsx   # Statistics cards
│   ├── TrendChart.tsx       # Time series chart
│   ├── AircraftHeatmap.tsx  # Aircraft heatmap
│   ├── ATAHeatmap.tsx       # ATA chapter heatmap
│   ├── ComponentHeatmap.tsx # Component heatmap
│   ├── ATADistribution.tsx  # Pie chart
│   ├── ProblemTypeChart.tsx # Bar chart
│   ├── TopProblems.tsx      # All findings by component
│   ├── PeriodComparison.tsx # Period comparison analysis
│   ├── FilterPanel.tsx      # Filtering UI
│   ├── DataTable.tsx        # Data table with sorting
│   └── DetailModal.tsx      # Modal for record details
├── lib/
│   ├── dataProcessor.ts     # Data cleaning & processing
│   └── types.ts             # TypeScript types
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
