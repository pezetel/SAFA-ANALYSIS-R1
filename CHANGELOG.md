# Changelog

## [4.0.0] - 2025-01-20

### Changed
- **Complete English Translation (Final Pass)**: Eliminated all remaining Turkish text across the entire codebase.
- Translated all API route error messages and success messages from Turkish to English:
  - `app/api/analyze/route.ts`: "Henüz veri yüklenmedi" → "No data has been loaded yet", "Analiz sırasında hata oluştu" → "An error occurred during analysis"
  - `app/api/process/route.ts`: "Geçersiz veri formatı" → "Invalid data format", "kayıt başarıyla işlendi" → "records successfully processed", "Veri işlenirken hata oluştu" → "An error occurred while processing data"
  - `app/api/upload/route.ts`: "Dosya bulunamadı" → "No file found", "kayıt başarıyla yüklendi ve işlendi" → "records successfully uploaded and processed", "Dosya işlenirken hata oluştu" → "An error occurred while processing the file"
- Version number updated to `4.0.0` and displayed on the home page header and footer.
- Package version bumped to `4.0.0`.

### Note
- Turkish column aliases in `lib/dataProcessor.ts` (e.g., `tarih`, `aciklama`) are intentionally kept for backward compatibility with Turkish-formatted Excel files.

## [3.0.0] - 2025-01-18

### Changed
- Major refactoring and performance improvements.
- Client-side data processing via localStorage for better Vercel compatibility.

## [2.0.0] - 2025-01-15

### Changed
- **Full English Translation**: All Turkish UI text, labels, tooltips, error messages, and descriptions have been translated to English.
- Updated `<html lang="tr">` to `<html lang="en">`.
- Updated page metadata (title, description) from Turkish to English.
- Updated all component labels, headings, and button texts across the entire application.
- Date formatting locale changed from Turkish (`tr`) to English (`enUS`) in all chart and heatmap components.
- Error messages and status messages translated to English.
- Filter panel labels (Aircraft Type, Aircraft, ATA Chapter, Problem Type, Component, Start Date, End Date) translated.
- Dashboard tabs (Overview, Trend Analysis, Period Analysis, Detailed Data) translated.
- Period Comparison section fully translated including quick-select buttons and summary cards.
- Data Table headers and pagination translated.
- Detail Modal headers and pagination translated.
- Heatmap legends and color scale descriptions translated.
- Top Problems section labels (Chronic, findings, aircraft) translated.
- File Upload component messages translated.
- Home page feature cards, stats preview, and info box translated.
- Version number displayed on the home page footer.
- Package version bumped to `2.0.0`.

### Fixed
- Consistent English terminology used throughout ("findings" instead of "bulgu", "records" instead of "kayıt", etc.).

## [1.0.0] - 2024-12-01

### Initial Release
- SAFA Trend Analysis Platform with Turkish interface.
- Excel file upload and processing.
- Dashboard with statistics, charts, heatmaps.
- Filter panel with aircraft type, ATA, problem type, and component filters.
- Period comparison analysis.
- Detailed data table with search and pagination.
- Export to Excel functionality.
