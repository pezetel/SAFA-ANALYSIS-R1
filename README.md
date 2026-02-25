# ✈️ SAFA Trend Analiz Platformu

Uçak SAFA (Safety Assessment of Foreign Aircraft) bulgularının kapsamlı trend analizi ve raporlama sistemi.

![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Özellikler

### 📤 Excel Yükleme & Veri İşleme
- Sürükle-bırak veya tıkla-seç ile XLSX/XLS dosya yükleme
- Otomatik veri validasyonu ve temizleme
- EOD numaraları ve standart kalıpların akıllı temizlenmesi
- Esnek kolon eşleştirme (W/O Date, ATA, A/C, Description)

### 📊 Dashboard & Görselleştirme
- **İstatistik Kartları**: Toplam bulgu, uçak sayısı, ATA chapter, dönem
- **ATA Distribution**: Pie chart ile sistem dağılımı
- **Problem Type Chart**: Bar chart ile problem tipleri (Missing, Damaged, vb.)
- **Top 10 Problems**: Kronik problem tespiti (5+ uçakta görülen)
- **Zaman Serisi Grafiği**: Aylık bulgu sayıları trendi
- **Aircraft Heatmap**: Uçak x Zaman yoğunluk haritası

### 🔍 İnteraktif Detay Görünümü
- Tüm grafiklere ve listelere tıklayarak detay görüntüleme
- Modal pencerede filtrelenmiş kayıtlar
- Canlı arama ve sayfalama
- CSV export özelliği

### 🎛️ Gelişmiş Filtreler
- Tarih aralığı seçimi
- Uçak multi-select
- ATA chapter seçimi
- Problem tipi filtreleme
- Aktif filtre sayacı

### 💾 Export & Raporlama
- CSV export (tüm veri veya filtrelenmiş)
- Türkçe tarih formatı
- Temiz, analiz edilmiş veri

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ veya 20+
- pnpm (veya npm/yarn)

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/yourusername/safa-trend-analysis.git
cd safa-trend-analysis
```

2. **Bağımlılıkları yükleyin**
```bash
pnpm install
# veya
npm install
# veya
yarn install
```

3. **Development server'ı başlatın**
```bash
pnpm dev
# veya
npm run dev
# veya
yarn dev
```

4. **Tarayıcıda açın**
```
http://localhost:3000
```

## 📦 Production Build

```bash
pnpm build
pnpm start
```

## 🌐 Vercel'e Deploy

### Otomatik Deploy (Önerilen)
1. GitHub repository'nizi Vercel'e bağlayın
2. Vercel otomatik olarak her commit'te deploy eder

### Manuel Deploy
```bash
npm i -g vercel
vercel
```

## 📝 Kullanım

### 1. Excel Formatı

Excel dosyanız şu kolonları içermelidir:

| Kolon Adı | Açıklama | Örnek |
|-----------|----------|-------|
| W/O Number | İş emri numarası | 1292209 |
| W/O Date | Tarih | 1.05.2025 veya 01.05.2025 |
| ATA | ATA kodu | 25-22-00 |
| A/C | Uçak kuyruk numarası | TC-SOH |
| Description | Bulgu açıklaması | FINDING (NRC) DOCUMENT EOD-B737-00-0001-R00... |

**Not:** Kolon isimleri esnek - sistem şu alternatifleri de kabul eder:
- Date: `w/o date`, `wo date`, `date`, `tarih`
- Aircraft: `a/c`, `ac`, `aircraft`, `registration`
- Description: `description`, `açıklama`, `finding`, `desc`

### 2. Veri Yükleme

1. Ana sayfada "Excel dosyasını sürükleyin veya tıklayın" alanına tıklayın
2. XLSX veya XLS dosyanızı seçin
3. Sistem otomatik olarak verileri işleyecek ve dashboard'a yönlendirecektir

### 3. Dashboard Kullanımı

#### Genel Bakış Sekmesi
- Grafiklere ve listelere **tıklayarak** detayları görün
- Kronik problemleri (5+ uçakta görülen) kolayca tespit edin
- Problem tiplerine göre dağılımı inceleyin

#### Trend Analizi Sekmesi
- Aylık trend grafiği ile zaman içindeki değişimleri izleyin
- Heat map'teki **hücrelere tıklayarak** o uçak + ay kombinasyonunun detaylarını görün
- Hangi uçakların hangi aylarda yoğun bulgu aldığını keşfedin

#### Detaylı Veriler Sekmesi
- Tüm kayıtları tablo formatında görüntüleyin
- Kolonlara tıklayarak sıralama yapın
- Canlı arama ile kayıt bulun
- CSV olarak export edin

### 4. Filtreler

- **Tarih Aralığı**: Başlangıç ve bitiş tarihi seçin
- **Uçak**: Birden fazla uçak seçimi yapabilirsiniz
- **ATA Chapter**: Sistem kategorilerine göre filtreleyin
- **Problem Tipi**: MISSING, DAMAGED, LOOSE, vb.
- **Temizle**: Tüm filtreleri sıfırlayın

## 🧹 Veri Temizleme

Sistem otomatik olarak şu gürültüleri temizler:

- ✅ `FINDING (NRC) DOCUMENT EOD-B737-00-0001-R00PARAG NO B01` → Temizlenir
- ✅ `PARAG NO B06`, `PARAGRAPH B12` → Temizlenir
- ✅ `DURING PERFORM WO:1159857` → Temizlenir
- ✅ `W/O 1234567`, `TC-SOH` referansları → Temizlenir
- ✅ `NRC`, `NRC1`, `NRC2` → Severity olarak ayrıştırılır

## 🎨 Komponent Kategorileri

Sistem otomatik olarak şu komponentleri tanır:

- `PLACARD` - Plaketler
- `SEAT` - Koltuklar
- `OVERHEAD_BIN` - Üst bölmeler
- `BIN_STOPPER` - Bölme stoperleri
- `TRAY_TABLE` - Tepsi masaları
- `GALLEY` - Galley
- `LAVATORY` - Lavabo
- `SEAT_BELT` - Emniyet kemeri
- `SUNSHADE` - Güneşlik
- `LIGHT` - Işıklar
- `DOOR` - Kapılar
- `OXYGEN` - Oksijen
- `CURTAIN` - Perde
- `LIFE_VEST` - Can yeleği
- `MIRROR` - Ayna
- `ENGINE` - Motor
- `LANDING_GEAR` - İniş takımı
- `WATER_SYSTEM` - Su sistemleri
- `BONDING` - Bonding wire
- `HINGE` - Menteşe
- `LATCH` - Mandal
- `CARPET` - Halı
- `TRIM_PANEL` - Trim ve paneller
- `OTHER` - Diğer

## 🔧 Problem Tipleri

- `MISSING` - Eksik parçalar
- `DAMAGED` - Hasarlı, kırık, yıpranmış
- `LOOSE` - Gevşek, sabit değil
- `INOPERATIVE` - Çalışmıyor
- `CLEANLINESS` - Temizlik
- `LOW_LEVEL` - Düşük seviye
- `ADJUSTMENT` - Ayar gerektiren
- `OTHER` - Diğer

## 🏗️ Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Excel Processing**: xlsx
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel

## 📂 Proje Yapısı

```
safa-trend-analysis/
├── app/
│   ├── api/
│   │   ├── upload/          # Excel upload endpoint
│   │   └── analyze/         # Analysis endpoint
│   ├── dashboard/           # Dashboard page
│   ├── layout.tsx
│   ├── page.tsx             # Home page
│   └── globals.css
├── components/
│   ├── FileUpload.tsx       # Excel upload component
│   ├── DashboardStats.tsx   # Statistics cards
│   ├── TrendChart.tsx       # Time series chart
│   ├── AircraftHeatmap.tsx  # Heatmap visualization
│   ├── ATADistribution.tsx  # Pie chart
│   ├── ProblemTypeChart.tsx # Bar chart
│   ├── TopProblems.tsx      # Top 10 problems list
│   ├── FilterPanel.tsx      # Filtering UI
│   ├── DataTable.tsx        # Data table with sorting
│   └── DetailModal.tsx      # Modal for details
├── lib/
│   ├── dataProcessor.ts     # Data cleaning & processing
│   └── types.ts             # TypeScript types
├── public/
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

Bu proje havacılık bakım operasyonları için trend analizi ihtiyacından doğmuştur.

## 🐛 Bug Raporlama

Bir hata bulduysanız veya öneriniz varsa lütfen [issue açın](https://github.com/yourusername/safa-trend-analysis/issues).

## 📧 İletişim

Sorularınız için: [email@example.com](mailto:email@example.com)

---

**Not**: Bu proje binlerce SAFA kaydını hızlıca analiz edebilir. Performans için optimize edilmiştir.
