'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Plane, Cpu, BookOpenCheck, AlertTriangle, Info, TrendingUp } from 'lucide-react';

export function CalculationGuide() {
  const [openSection, setOpenSection] = useState<string | null>('overview');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const Section = ({ id, icon, title, color, children }: {
    id: string;
    icon: React.ReactNode;
    title: string;
    color: string;
    children: React.ReactNode;
  }) => {
    const isOpen = openSection === id;
    const colorMap: Record<string, { border: string; bg: string; iconBg: string; iconText: string; titleText: string }> = {
      blue: { border: 'border-blue-300', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-700', titleText: 'text-blue-900' },
      amber: { border: 'border-amber-300', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconText: 'text-amber-700', titleText: 'text-amber-900' },
      purple: { border: 'border-purple-300', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconText: 'text-purple-700', titleText: 'text-purple-900' },
      red: { border: 'border-red-300', bg: 'bg-red-50', iconBg: 'bg-red-100', iconText: 'text-red-700', titleText: 'text-red-900' },
      green: { border: 'border-green-300', bg: 'bg-green-50', iconBg: 'bg-green-100', iconText: 'text-green-700', titleText: 'text-green-900' },
      indigo: { border: 'border-indigo-300', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconText: 'text-indigo-700', titleText: 'text-indigo-900' },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
      <div className={`border rounded-xl overflow-hidden transition-all ${isOpen ? `${c.border} shadow-md` : 'border-gray-200'}`}>
        <button
          onClick={() => toggleSection(id)}
          className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
            isOpen ? c.bg : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOpen ? `${c.iconBg} ${c.iconText}` : 'bg-gray-100 text-gray-500'}`}>
              {icon}
            </div>
            <span className={`font-bold text-sm ${isOpen ? c.titleText : 'text-gray-900'}`}>{title}</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {isOpen && (
          <div className="p-5 bg-white border-t border-gray-100 text-sm text-gray-700 leading-relaxed space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Hesaplama Kılavuzu</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Trend analizinde kullanılan Weighted Average, Weighted Sigma ve Alert Threshold hesaplamalarının detaylı açıklaması
            </p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <strong>💡 Bilgi:</strong> Aşağıdaki tüm örnekler 6 aylık hayali verilerle gösterilmiştir. Filo büyüklüğü ~80 uçak baz alınmıştır (her uçağa ayda ~1 EOD).
          Gerçek hesaplamalar yüklediğiniz Excel verilerine göre otomatik yapılır.
          Sigma (σ) çarpanını Trend Analysis sekmesindeki kontrol panelinden ayarlayabilirsiniz (0σ – 4σ arası).
        </div>
      </div>

      {/* SECTION 1: Genel Bakış */}
      <Section
        id="overview"
        icon={<Info className="h-4 w-4" />}
        title="1. Genel Bakış — Temel Kavramlar"
        color="blue"
      >
        <p>
          Sistemdeki trend analizi, her ay için bir <strong>Finding Rate (Bulgu Oranı)</strong> hesaplar. Bu oran, bulgu sayısının
          EOD (End of Day / uçuş bakım operasyonu) sayısına bölünmesiyle elde edilir:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs">
          <p className="text-indigo-700 font-bold">Finding Rate = Finding Sayısı / EOD Sayısı</p>
        </div>
        <p>
          Ardından bu rate'ler üzerinden <strong>Weighted Average (Ağırlıklı Ortalama)</strong> ve
          <strong> Weighted Sigma (Ağırlıklı Standart Sapma)</strong> hesaplanır.
          Ağırlık olarak <strong>EOD sayısı</strong> kullanılır — çok EOD uygulanan ayların verisi daha güvenilir kabul edilir.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-2">
          <p><span className="text-green-700 font-bold">Weighted Avg</span> = Σ(rate_i × EOD_i) / Σ(EOD_i)</p>
          <p><span className="text-purple-700 font-bold">Weighted Sigma</span> = √[ Σ(EOD_i × (rate_i − Avg)²) / Σ(EOD_i) ]</p>
          <p><span className="text-red-700 font-bold">Threshold</span> = Weighted Avg + <em>kullanıcının seçtiği σ çarpanı</em> × Weighted Sigma</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>⚠️ Threshold (Alarm Eşiği):</strong> Kullanıcı Sigma kontrol panelinden 0σ, 1σ, 1.5σ, 2σ, 2.5σ, 3σ, 3.5σ veya 4σ seçebilir.
          <br />• <strong>0σ:</strong> Ortalama üstündeki her değer alarm verir (en hassas).
          <br />• <strong>2σ (varsayılan):</strong> İstatistiksel olarak anlamlı sapmaları yakalar.
          <br />• <strong>4σ:</strong> Sadece aşırı uç değerler alarm verir (en az hassas).
        </div>

        <p className="font-semibold text-gray-900 mt-2">Neden Ağırlıklı (Weighted)?</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-1">
          <p><strong>Senaryo:</strong> Temmuz'da 30 EOD uygulanmış, Ağustos'ta 75 EOD uygulanmış olsun.</p>
          <p>Temmuz: 3 finding / 30 EOD = Rate <strong>0.100</strong> (yüksek görünüyor!)</p>
          <p>Ağustos: 4 finding / 75 EOD = Rate <strong>0.053</strong> (düşük)</p>
          <p className="pt-2">Basit ortalama: (0.100 + 0.053) / 2 = <strong>0.077</strong> ← Temmuz'un etkisi aşırı büyük!</p>
          <p>Ağırlıklı ortalama: (0.100×30 + 0.053×75) / 105 = <strong>0.067</strong> ← Gerçeğe daha yakın!</p>
          <p className="pt-1 text-blue-700">→ Düşük EOD'li aylar ortalamayı bozamaz. Güvenilir veri daha fazla ağırlık taşır.</p>
        </div>
      </Section>

      {/* SECTION 2: Component Heatmap */}
      <Section
        id="component"
        icon={<Cpu className="h-4 w-4" />}
        title="2. Component Heatmap — Hesaplama"
        color="amber"
      >
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mb-3">
          <strong>Mantık:</strong> Her component kendi geçmişiyle karşılaştırılır. Weighted Avg ve Sigma o component'in kendi aylık rate'lerinden hesaplanır.
        </div>

        <p className="font-semibold">Rate Formülü:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs">
          Rate = O component'in o aydaki finding sayısı / <strong>O aydaki TOPLAM EOD sayısı</strong>
        </div>

        <p className="font-semibold mt-3">6 Aylık Örnek: PLACARD Component'i</p>
        <p className="text-xs text-gray-500 mb-2">~80 uçaklık filoda, her uçağa ayda ortalama 1 EOD uygulanıyor</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-amber-50">
                <th className="border border-amber-200 p-2 text-left">Ay</th>
                <th className="border border-amber-200 p-2 text-center">PLACARD Findings</th>
                <th className="border border-amber-200 p-2 text-center">Toplam EOD</th>
                <th className="border border-amber-200 p-2 text-center">Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 p-2">Ocak</td><td className="border border-gray-200 p-2 text-center">3</td><td className="border border-gray-200 p-2 text-center">78</td><td className="border border-gray-200 p-2 text-center font-mono">3/78 = 0.038</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Şubat</td><td className="border border-gray-200 p-2 text-center">5</td><td className="border border-gray-200 p-2 text-center">72</td><td className="border border-gray-200 p-2 text-center font-mono">5/72 = 0.069</td></tr>
              <tr><td className="border border-gray-200 p-2">Mart</td><td className="border border-gray-200 p-2 text-center">1</td><td className="border border-gray-200 p-2 text-center">82</td><td className="border border-gray-200 p-2 text-center font-mono">1/82 = 0.012</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Nisan</td><td className="border border-gray-200 p-2 text-center">4</td><td className="border border-gray-200 p-2 text-center">85</td><td className="border border-gray-200 p-2 text-center font-mono">4/85 = 0.047</td></tr>
              <tr><td className="border border-gray-200 p-2">Mayıs</td><td className="border border-gray-200 p-2 text-center">10</td><td className="border border-gray-200 p-2 text-center">76</td><td className="border border-gray-200 p-2 text-center font-mono">10/76 = 0.132</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Haziran</td><td className="border border-gray-200 p-2 text-center">3</td><td className="border border-gray-200 p-2 text-center">80</td><td className="border border-gray-200 p-2 text-center font-mono">3/80 = 0.038</td></tr>
            </tbody>
          </table>
        </div>

        <p className="font-semibold mt-4">Adım 1: Weighted Average</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p>Toplam Ağırlık = 78 + 72 + 82 + 85 + 76 + 80 = <strong>473</strong></p>
          <p className="pt-1">Wt. Avg = (0.038×78 + 0.069×72 + 0.012×82 + 0.047×85 + 0.132×76 + 0.038×80) / 473</p>
          <p>= (2.964 + 4.968 + 0.984 + 3.995 + 10.032 + 3.04) / 473</p>
          <p>= 25.983 / 473</p>
          <p className="text-green-700 font-bold">= 0.055</p>
        </div>

        <p className="font-semibold mt-4">Adım 2: Weighted Sigma</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p>Ocak: &nbsp;&nbsp; 78 × (0.038 − 0.055)² = 78 × 0.000289 = 0.02254</p>
          <p>Şubat: &nbsp;72 × (0.069 − 0.055)² = 72 × 0.000196 = 0.01411</p>
          <p>Mart: &nbsp;&nbsp;82 × (0.012 − 0.055)² = 82 × 0.001849 = 0.15162</p>
          <p>Nisan: &nbsp;85 × (0.047 − 0.055)² = 85 × 0.000064 = 0.00544</p>
          <p>Mayıs: &nbsp;76 × (0.132 − 0.055)² = 76 × 0.005929 = 0.45060</p>
          <p>Haziran: 80 × (0.038 − 0.055)² = 80 × 0.000289 = 0.02312</p>
          <p className="pt-1">Toplam = 0.66743</p>
          <p>Varyans = 0.66743 / 473 = 0.001411</p>
          <p className="text-purple-700 font-bold">Sigma = √0.001411 = 0.038</p>
        </div>

        <p className="font-semibold mt-4">Adım 3: Threshold (kullanıcı 2σ seçtiyse)</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs">
          <p className="text-red-700 font-bold">Threshold = 0.055 + 2 × 0.038 = 0.131</p>
        </div>

        <p className="font-semibold mt-4">Adım 4: Heatmap Hücre Renkleri</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-amber-50">
                <th className="border border-amber-200 p-2 text-left">Ay</th>
                <th className="border border-amber-200 p-2 text-center">Rate</th>
                <th className="border border-amber-200 p-2 text-center">Threshold</th>
                <th className="border border-amber-200 p-2 text-center">Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 p-2">Ocak</td><td className="border border-gray-200 p-2 text-center font-mono">0.038</td><td className="border border-gray-200 p-2 text-center font-mono">0.131</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Şubat</td><td className="border border-gray-200 p-2 text-center font-mono">0.069</td><td className="border border-gray-200 p-2 text-center font-mono">0.131</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr><td className="border border-gray-200 p-2">Mart</td><td className="border border-gray-200 p-2 text-center font-mono">0.012</td><td className="border border-gray-200 p-2 text-center font-mono">0.131</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Nisan</td><td className="border border-gray-200 p-2 text-center font-mono">0.047</td><td className="border border-gray-200 p-2 text-center font-mono">0.131</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr><td className="border border-gray-200 p-2 font-bold">Mayıs</td><td className="border border-gray-200 p-2 text-center font-mono font-bold text-red-600">0.132</td><td className="border border-gray-200 p-2 text-center font-mono">0.131</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">🔴 ALERT</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Haziran</td><td className="border border-gray-200 p-2 text-center font-mono">0.038</td><td className="border border-gray-200 p-2 text-center font-mono">0.131</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">→ Heatmap satırının sonunda <strong>Avg: 0.055</strong> ve <strong>Threshold: 0.131</strong> gösterilir.</p>
      </Section>

      {/* SECTION 3: ATA Chapter Heatmap */}
      <Section
        id="ata"
        icon={<BookOpenCheck className="h-4 w-4" />}
        title="3. ATA Chapter Heatmap — Hesaplama"
        color="purple"
      >
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900 mb-3">
          <strong>Mantık:</strong> Component ile aynı formül, sadece gruplama ATA 2-digit koduna göre yapılır.
          Her ATA chapter kendi geçmişiyle karşılaştırılır.
        </div>

        <p className="font-semibold">Rate Formülü:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs">
          Rate = O ATA'nın o aydaki finding sayısı / <strong>O aydaki TOPLAM EOD sayısı</strong>
        </div>

        <p className="font-semibold mt-3">6 Aylık Örnek: ATA 25 (Equipment/Furnishings)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-purple-50">
                <th className="border border-purple-200 p-2 text-left">Ay</th>
                <th className="border border-purple-200 p-2 text-center">ATA 25 Findings</th>
                <th className="border border-purple-200 p-2 text-center">Toplam EOD</th>
                <th className="border border-purple-200 p-2 text-center">Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 p-2">Ocak</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center">78</td><td className="border border-gray-200 p-2 text-center font-mono">6/78 = 0.077</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Şubat</td><td className="border border-gray-200 p-2 text-center">8</td><td className="border border-gray-200 p-2 text-center">72</td><td className="border border-gray-200 p-2 text-center font-mono">8/72 = 0.111</td></tr>
              <tr><td className="border border-gray-200 p-2">Mart</td><td className="border border-gray-200 p-2 text-center">4</td><td className="border border-gray-200 p-2 text-center">82</td><td className="border border-gray-200 p-2 text-center font-mono">4/82 = 0.049</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Nisan</td><td className="border border-gray-200 p-2 text-center">7</td><td className="border border-gray-200 p-2 text-center">85</td><td className="border border-gray-200 p-2 text-center font-mono">7/85 = 0.082</td></tr>
              <tr><td className="border border-gray-200 p-2">Mayıs</td><td className="border border-gray-200 p-2 text-center">14</td><td className="border border-gray-200 p-2 text-center">76</td><td className="border border-gray-200 p-2 text-center font-mono">14/76 = 0.184</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Haziran</td><td className="border border-gray-200 p-2 text-center">5</td><td className="border border-gray-200 p-2 text-center">80</td><td className="border border-gray-200 p-2 text-center font-mono">5/80 = 0.063</td></tr>
            </tbody>
          </table>
        </div>

        <p className="font-semibold mt-4">Adım 1: Weighted Average</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p>Toplam Ağırlık = 78 + 72 + 82 + 85 + 76 + 80 = <strong>473</strong></p>
          <p className="pt-1">Wt. Avg = (0.077×78 + 0.111×72 + 0.049×82 + 0.082×85 + 0.184×76 + 0.063×80) / 473</p>
          <p>= (6.006 + 7.992 + 4.018 + 6.970 + 13.984 + 5.040) / 473</p>
          <p>= 44.010 / 473</p>
          <p className="text-green-700 font-bold">= 0.093</p>
        </div>

        <p className="font-semibold mt-4">Adım 2: Weighted Sigma</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p>Ocak: &nbsp;&nbsp; 78 × (0.077 − 0.093)² = 78 × 0.000256 = 0.01997</p>
          <p>Şubat: &nbsp;72 × (0.111 − 0.093)² = 72 × 0.000324 = 0.02333</p>
          <p>Mart: &nbsp;&nbsp;82 × (0.049 − 0.093)² = 82 × 0.001936 = 0.15875</p>
          <p>Nisan: &nbsp;85 × (0.082 − 0.093)² = 85 × 0.000121 = 0.01029</p>
          <p>Mayıs: &nbsp;76 × (0.184 − 0.093)² = 76 × 0.008281 = 0.62936</p>
          <p>Haziran: 80 × (0.063 − 0.093)² = 80 × 0.000900 = 0.07200</p>
          <p className="pt-1">Toplam = 0.91370</p>
          <p>Varyans = 0.91370 / 473 = 0.001932</p>
          <p className="text-purple-700 font-bold">Sigma = √0.001932 = 0.044</p>
        </div>

        <p className="font-semibold mt-4">Adım 3: Threshold (kullanıcı 2σ seçtiyse)</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs">
          <p className="text-red-700 font-bold">Threshold = 0.093 + 2 × 0.044 = 0.181</p>
        </div>

        <p className="font-semibold mt-4">Adım 4: Heatmap Hücre Renkleri</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-purple-50">
                <th className="border border-purple-200 p-2 text-left">Ay</th>
                <th className="border border-purple-200 p-2 text-center">Rate</th>
                <th className="border border-purple-200 p-2 text-center">Threshold</th>
                <th className="border border-purple-200 p-2 text-center">Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 p-2">Ocak</td><td className="border border-gray-200 p-2 text-center font-mono">0.077</td><td className="border border-gray-200 p-2 text-center font-mono">0.181</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Şubat</td><td className="border border-gray-200 p-2 text-center font-mono">0.111</td><td className="border border-gray-200 p-2 text-center font-mono">0.181</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr><td className="border border-gray-200 p-2">Mart</td><td className="border border-gray-200 p-2 text-center font-mono">0.049</td><td className="border border-gray-200 p-2 text-center font-mono">0.181</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Nisan</td><td className="border border-gray-200 p-2 text-center font-mono">0.082</td><td className="border border-gray-200 p-2 text-center font-mono">0.181</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr><td className="border border-gray-200 p-2 font-bold">Mayıs</td><td className="border border-gray-200 p-2 text-center font-mono font-bold text-red-600">0.184</td><td className="border border-gray-200 p-2 text-center font-mono">0.181</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">🔴 ALERT</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2">Haziran</td><td className="border border-gray-200 p-2 text-center font-mono">0.063</td><td className="border border-gray-200 p-2 text-center font-mono">0.181</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">→ Mayıs'ta 0.184 {'>'} 0.181 → kıl payı 🔴 ALERT!</p>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800 mt-3">
          <strong>Farklı σ seçiminde bu ATA için Threshold nasıl değişir?</strong>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="font-bold">1σ</div>
              <div className="font-mono">0.093 + 0.044 = <strong>0.137</strong></div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="font-bold">2σ</div>
              <div className="font-mono">0.093 + 0.088 = <strong>0.181</strong></div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="font-bold">3σ</div>
              <div className="font-mono">0.093 + 0.132 = <strong>0.225</strong></div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="font-bold">4σ</div>
              <div className="font-mono">0.093 + 0.176 = <strong>0.269</strong></div>
            </div>
          </div>
          <p className="mt-2 text-purple-600">→ 1σ seçilseydi Mayıs (0.184) {'>'} 0.137 → ALERT. 3σ'da ise 0.184 {'<'} 0.225 → normal kalırdı.</p>
        </div>
      </Section>

      {/* SECTION 4: Aircraft Analysis — Filo Geneli Weighted Avg + Nσ */}
      <Section
        id="aircraft"
        icon={<Plane className="h-4 w-4" />}
        title="4. Aircraft Analysis — Hesaplama (Filo Geneli Weighted Avg + Nσ)"
        color="red"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 mb-3">
          <strong>ℹ️ Aircraft Analizi — Dönem Bazlı Filo Karşılaştırması</strong>
          <br />• Her uçağın <strong>tüm dönem boyunca</strong> toplam finding / toplam EOD oranı hesaplanır (Period Rate)
          <br />• Filo genelinde tüm uçakların rate'leri üzerinden <strong>Fleet Weighted Avg</strong> ve <strong>Fleet Weighted Sigma</strong> hesaplanır
          <br />• Ağırlık olarak her uçağın <strong>toplam EOD sayısı</strong> kullanılır
          <br />• Sigma çarpanı slider'ından <strong>etkilenir</strong> (Component ve ATA ile aynı mantık)
          <br />• Threshold = Fleet Weighted Avg + Nσ × Fleet Weighted Sigma
        </div>

        <p className="font-semibold">Rate Formülü:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs">
          Uçak Period Rate = O uçağın <strong>tüm dönemdeki toplam finding</strong> sayısı / <strong>O uçağın tüm dönemdeki toplam EOD</strong> sayısı
        </div>
        <p className="text-xs text-gray-500 mt-1">⚡ Component ve ATA'da rate aylık hesaplanır, burada tüm dönem tek rate'e indirgenir.</p>

        <p className="font-semibold mt-3">Fleet Weighted Average & Sigma:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs space-y-1">
          <p><span className="text-green-700 font-bold">Fleet Wt. Avg</span> = Σ(uçak_rate_i × uçak_EOD_i) / Σ(uçak_EOD_i)</p>
          <p><span className="text-purple-700 font-bold">Fleet Wt. Sigma</span> = √[ Σ(uçak_EOD_i × (uçak_rate_i − Fleet Avg)²) / Σ(uçak_EOD_i) ]</p>
          <p><span className="text-red-700 font-bold">Threshold</span> = Fleet Wt. Avg + σ çarpanı × Fleet Wt. Sigma</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">Çok EOD yapılmış uçaklar filo istatistiğinde daha fazla ağırlık taşır.</p>

        {/* ============ 6 UÇAK TAM ÖRNEK ============ */}
        <p className="font-semibold mt-4">6 Aylık Tam Örnek — 6 Uçak</p>
        <p className="text-xs text-gray-500 mb-2">
          Her uçağın tüm dönem boyunca toplam finding ve EOD sayıları. TC-LNA ve TC-SEK bazı aylarda EOD uygulanmamış.
        </p>

        {/* Dönem Toplamları Tablosu */}
        <p className="font-semibold text-xs text-gray-600 mb-1">📋 Dönem Toplamları (Finding / EOD / Period Rate):</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-red-200 p-2 text-left">Uçak</th>
                <th className="border border-red-200 p-2 text-center">Toplam Finding</th>
                <th className="border border-red-200 p-2 text-center">Toplam EOD</th>
                <th className="border border-red-200 p-2 text-center">Period Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 p-2 font-medium">TC-SOH</td><td className="border border-gray-200 p-2 text-center">12</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center font-mono">12/6 = <strong>2.000</strong></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 font-medium">TC-JHA</td><td className="border border-gray-200 p-2 text-center">11</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center font-mono">11/6 = <strong>1.833</strong></td></tr>
              <tr><td className="border border-gray-200 p-2 font-medium">TC-LNA</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center">4</td><td className="border border-gray-200 p-2 text-center font-mono">6/4 = <strong>1.500</strong></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 font-medium">TC-SEK</td><td className="border border-gray-200 p-2 text-center">14</td><td className="border border-gray-200 p-2 text-center">4</td><td className="border border-gray-200 p-2 text-center font-mono">14/4 = <strong>3.500</strong></td></tr>
              <tr><td className="border border-gray-200 p-2 font-medium">TC-APU</td><td className="border border-gray-200 p-2 text-center">7</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center font-mono">7/6 = <strong>1.167</strong></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 font-medium">TC-MNR</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center">6</td><td className="border border-gray-200 p-2 text-center font-mono">6/6 = <strong>1.000</strong></td></tr>
            </tbody>
          </table>
        </div>

        <p className="font-semibold mt-4">Adım 1: Fleet Weighted Average</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p>Toplam Ağırlık (toplam EOD) = 6 + 6 + 4 + 4 + 6 + 6 = <strong>32</strong></p>
          <p className="pt-1">Fleet Wt. Avg = Σ(rate_i × EOD_i) / 32</p>
          <p>= (2.000×6 + 1.833×6 + 1.500×4 + 3.500×4 + 1.167×6 + 1.000×6) / 32</p>
          <p>= (12.000 + 10.998 + 6.000 + 14.000 + 7.002 + 6.000) / 32</p>
          <p>= 56.000 / 32</p>
          <p className="text-green-700 font-bold">= 1.750</p>
          <p className="text-gray-500 pt-1">(Not: Bu aynı zamanda toplam finding / toplam EOD = 56/32 = 1.750'dir)</p>
        </div>

        <p className="font-semibold mt-4">Adım 2: Fleet Weighted Sigma</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p>TC-SOH: 6 × (2.000 − 1.750)² = 6 × 0.0625 = 0.375</p>
          <p>TC-JHA: 6 × (1.833 − 1.750)² = 6 × 0.00689 = 0.041</p>
          <p>TC-LNA: 4 × (1.500 − 1.750)² = 4 × 0.0625 = 0.250</p>
          <p>TC-SEK: 4 × (3.500 − 1.750)² = 4 × 3.0625 = 12.250</p>
          <p>TC-APU: 6 × (1.167 − 1.750)² = 6 × 0.33989 = 2.039</p>
          <p>TC-MNR: 6 × (1.000 − 1.750)² = 6 × 0.5625 = 3.375</p>
          <p className="pt-1">Toplam = 18.330</p>
          <p>Varyans = 18.330 / 32 = 0.5728</p>
          <p className="text-purple-700 font-bold">Fleet Sigma = √0.5728 = 0.757</p>
        </div>

        <p className="font-semibold mt-4">Adım 3: Threshold (kullanıcı 2σ seçtiyse)</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs">
          <p className="text-red-700 font-bold">Threshold = 1.750 + 2 × 0.757 = 3.264</p>
        </div>

        <p className="font-semibold mt-4">Adım 4: Sonuçlar</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-red-200 p-2 text-left">Uçak</th>
                <th className="border border-red-200 p-2 text-center">Period Rate</th>
                <th className="border border-red-200 p-2 text-center">Fleet Avg</th>
                <th className="border border-red-200 p-2 text-center">Threshold (2σ)</th>
                <th className="border border-red-200 p-2 text-center">Deviation</th>
                <th className="border border-red-200 p-2 text-center">Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 p-2 font-medium">TC-SOH</td><td className="border border-gray-200 p-2 text-center font-mono">2.000</td><td className="border border-gray-200 p-2 text-center font-mono">1.750</td><td className="border border-gray-200 p-2 text-center font-mono">3.264</td><td className="border border-gray-200 p-2 text-center font-mono text-green-600">-1.264</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 font-medium">TC-JHA</td><td className="border border-gray-200 p-2 text-center font-mono">1.833</td><td className="border border-gray-200 p-2 text-center font-mono">1.750</td><td className="border border-gray-200 p-2 text-center font-mono">3.264</td><td className="border border-gray-200 p-2 text-center font-mono text-green-600">-1.431</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr><td className="border border-gray-200 p-2 font-medium">TC-LNA</td><td className="border border-gray-200 p-2 text-center font-mono">1.500</td><td className="border border-gray-200 p-2 text-center font-mono">1.750</td><td className="border border-gray-200 p-2 text-center font-mono">3.264</td><td className="border border-gray-200 p-2 text-center font-mono text-green-600">-1.764</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 font-medium font-bold">TC-SEK</td><td className="border border-gray-200 p-2 text-center font-mono font-bold text-red-600">3.500</td><td className="border border-gray-200 p-2 text-center font-mono">1.750</td><td className="border border-gray-200 p-2 text-center font-mono">3.264</td><td className="border border-gray-200 p-2 text-center font-mono text-red-600 font-bold">+0.236</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">🔴 ALERT</span></td></tr>
              <tr><td className="border border-gray-200 p-2 font-medium">TC-APU</td><td className="border border-gray-200 p-2 text-center font-mono">1.167</td><td className="border border-gray-200 p-2 text-center font-mono">1.750</td><td className="border border-gray-200 p-2 text-center font-mono">3.264</td><td className="border border-gray-200 p-2 text-center font-mono text-green-600">-2.097</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 font-medium">TC-MNR</td><td className="border border-gray-200 p-2 text-center font-mono">1.000</td><td className="border border-gray-200 p-2 text-center font-mono">1.750</td><td className="border border-gray-200 p-2 text-center font-mono">3.264</td><td className="border border-gray-200 p-2 text-center font-mono text-green-600">-2.264</td><td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Normal</span></td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3">
          <p className="font-semibold text-xs text-gray-900">🔍 Örneklerin Açıklaması:</p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-1">
            <p><strong>TC-SEK:</strong> 14 finding / 4 EOD = Period Rate <strong>3.500</strong></p>
            <p>Fleet Weighted Avg = 1.750, Fleet Sigma = 0.757</p>
            <p>Threshold (2σ) = 1.750 + 2 × 0.757 = <strong>3.264</strong></p>
            <p className="text-red-700 font-bold">3.500 {'>'} 3.264 → 🔴 ALERT</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
            <p><strong>TC-SOH:</strong> 12 finding / 6 EOD = Period Rate <strong>2.000</strong></p>
            <p>Threshold (2σ) = <strong>3.264</strong></p>
            <p className="text-green-700 font-bold">2.000 ≤ 3.264 → ✅ Normal</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
            <p><strong>TC-MNR:</strong> 6 finding / 6 EOD = Period Rate <strong>1.000</strong></p>
            <p>Threshold (2σ) = <strong>3.264</strong></p>
            <p className="text-green-700 font-bold">1.000 ≤ 3.264 → ✅ Normal — filonun en düşük rate'li uçağı</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 mt-3">
          <strong>Farklı σ seçiminde TC-SEK için Threshold nasıl değişir?</strong>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <div className="bg-white rounded p-2 border border-red-100">
              <div className="font-bold">1σ</div>
              <div className="font-mono">1.750 + 0.757 = <strong>2.507</strong></div>
              <div className="text-red-600 font-bold mt-1">🔴 ALERT</div>
            </div>
            <div className="bg-white rounded p-2 border border-red-100">
              <div className="font-bold">2σ</div>
              <div className="font-mono">1.750 + 1.514 = <strong>3.264</strong></div>
              <div className="text-red-600 font-bold mt-1">🔴 ALERT</div>
            </div>
            <div className="bg-white rounded p-2 border border-red-100">
              <div className="font-bold">3σ</div>
              <div className="font-mono">1.750 + 2.271 = <strong>4.021</strong></div>
              <div className="text-green-600 font-bold mt-1">✅ Normal</div>
            </div>
            <div className="bg-white rounded p-2 border border-red-100">
              <div className="font-bold">4σ</div>
              <div className="font-mono">1.750 + 3.028 = <strong>4.778</strong></div>
              <div className="text-green-600 font-bold mt-1">✅ Normal</div>
            </div>
          </div>
          <p className="mt-2 text-red-600">→ 1σ ve 2σ'da TC-SEK alarm verir. 3σ'da ise 3.500 {'<'} 4.021 → normal kalır.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mt-3">
          <strong>💡 Özet — Aircraft Analizi:</strong>
          <br />• Her uçağın <strong>tüm dönem boyunca</strong> tek bir Period Rate'i hesaplanır (toplam finding / toplam EOD)
          <br />• Filo genelindeki tüm uçakların rate'lerinden <strong>Fleet Weighted Avg</strong> ve <strong>Fleet Weighted Sigma</strong> elde edilir
          <br />• Ağırlık = uçağın toplam EOD'si → çok uçuş yapan uçaklar istatistikte daha ağır basar
          <br />• Threshold = Fleet Avg + Nσ × Fleet Sigma → <strong>Sigma slider etkili</strong>
          <br />• EOD'si olmayan uçaklar → rate hesaplanamaz → N/A
          <br />• Component ve ATA'dan farkı: aylık değil dönem bazlı, payda filo EOD'si değil uçağın kendi EOD'si
        </div>
      </Section>

      {/* SECTION 5: Karşılaştırma Özeti */}
      <Section
        id="comparison"
        icon={<TrendingUp className="h-4 w-4" />}
        title="5. Üç Heatmap Karşılaştırma Özeti"
        color="green"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-green-50">
                <th className="border border-green-200 p-2 text-left">Özellik</th>
                <th className="border border-green-200 p-2 text-center">🔧 Component Heatmap</th>
                <th className="border border-green-200 p-2 text-center">📖 ATA Heatmap</th>
                <th className="border border-green-200 p-2 text-center">✈️ Aircraft Analysis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Rate payı</td>
                <td className="border border-gray-200 p-2 text-center">Component findings (aylık)</td>
                <td className="border border-gray-200 p-2 text-center">ATA findings (aylık)</td>
                <td className="border border-gray-200 p-2 text-center">Uçak findings (tüm dönem)</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Rate paydası</td>
                <td className="border border-gray-200 p-2 text-center font-bold text-amber-700">Toplam EOD (aylık, ~78-85)</td>
                <td className="border border-gray-200 p-2 text-center font-bold text-purple-700">Toplam EOD (aylık, ~78-85)</td>
                <td className="border border-gray-200 p-2 text-center font-bold text-red-700">Uçağın kendi toplam EOD'si (tüm dönem)</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Rate zaman dilimi</td>
                <td className="border border-gray-200 p-2 text-center">Aylık (her ay ayrı rate)</td>
                <td className="border border-gray-200 p-2 text-center">Aylık (her ay ayrı rate)</td>
                <td className="border border-gray-200 p-2 text-center">Dönem bazlı (tek rate)</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Ortalama tipi</td>
                <td className="border border-gray-200 p-2 text-center">Kendi Weighted Avg (aylar üzerinden)</td>
                <td className="border border-gray-200 p-2 text-center">Kendi Weighted Avg (aylar üzerinden)</td>
                <td className="border border-gray-200 p-2 text-center">Fleet Weighted Avg (uçaklar üzerinden)</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Sigma kullanımı</td>
                <td className="border border-gray-200 p-2 text-center">✅ Kendi Weighted Sigma</td>
                <td className="border border-gray-200 p-2 text-center">✅ Kendi Weighted Sigma</td>
                <td className="border border-gray-200 p-2 text-center">✅ Fleet Weighted Sigma</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Threshold</td>
                <td className="border border-gray-200 p-2 text-center">Avg + σ çarpanı × Sigma</td>
                <td className="border border-gray-200 p-2 text-center">Avg + σ çarpanı × Sigma</td>
                <td className="border border-gray-200 p-2 text-center">Fleet Avg + σ çarpanı × Fleet Sigma</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">σ slider etkisi</td>
                <td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">✅ Var</span></td>
                <td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">✅ Var</span></td>
                <td className="border border-gray-200 p-2 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">✅ Var</span></td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2 font-semibold bg-gray-50">Karşılaştırma</td>
                <td className="border border-gray-200 p-2 text-center">Kendi geçmişiyle</td>
                <td className="border border-gray-200 p-2 text-center">Kendi geçmişiyle</td>
                <td className="border border-gray-200 p-2 text-center">Filodaki diğer uçaklarla</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-amber-600" />
              <span className="font-bold text-xs text-amber-900">Component</span>
            </div>
            <p className="text-xs text-amber-800">
              "PLACARD bu ay kendi normalinin üstünde mi?"
              sorusunu yanıtlar. Kendi geçmişindeki dalgalanmayı sigma ile ölçer.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpenCheck className="h-4 w-4 text-purple-600" />
              <span className="font-bold text-xs text-purple-900">ATA Chapter</span>
            </div>
            <p className="text-xs text-purple-800">
              "ATA 25 sistemi bu ay kendi normalinin üstünde mi?"
              sorusunu yanıtlar. Component ile aynı formül, farklı gruplama.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="h-4 w-4 text-red-600" />
              <span className="font-bold text-xs text-red-900">Aircraft</span>
            </div>
            <p className="text-xs text-red-800">
              "TC-SEK tüm dönem boyunca filo ortalamasına göre istatistiksel olarak anlamlı şekilde yüksek mi?"
              sorusunu yanıtlar. Filo geneli weighted avg + Nσ ile kontrol eder.
            </p>
          </div>
        </div>
      </Section>

      {/* SECTION 6: Sigma Multiplier */}
      <Section
        id="sigma"
        icon={<AlertTriangle className="h-4 w-4" />}
        title="6. Sigma (σ) Çarpanı ve Hassasiyet"
        color="indigo"
      >
        <p>
          Trend Analysis sekmesindeki <strong>Sigma kontrol paneli</strong> ile alarm eşiğinin hassasiyetini ayarlarsınız.
          Bu ayar <strong>Component Heatmap</strong>, <strong>ATA Heatmap</strong>, <strong>Aircraft Analysis</strong> ve <strong>General Alert Panel</strong>'i etkiler.
        </p>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-indigo-50">
                <th className="border border-indigo-200 p-2 text-center">σ Çarpanı</th>
                <th className="border border-indigo-200 p-2 text-center">Örnek Threshold<br /><span className="font-normal text-gray-500">(Avg=0.093, Sigma=0.044)</span></th>
                <th className="border border-indigo-200 p-2 text-center">Hassasiyet</th>
                <th className="border border-indigo-200 p-2 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-red-50"><td className="border border-gray-200 p-2 text-center font-bold">0σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0 = 0.093</td><td className="border border-gray-200 p-2 text-center">🔴 En hassas</td><td className="border border-gray-200 p-2">Avg'nin üstündeki her değer alarm verir</td></tr>
              <tr><td className="border border-gray-200 p-2 text-center font-bold">1σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0.044 = 0.137</td><td className="border border-gray-200 p-2 text-center">🟠 Hassas</td><td className="border border-gray-200 p-2">Küçük sapmalar bile alarm üretir</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 text-center font-bold">1.5σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0.066 = 0.159</td><td className="border border-gray-200 p-2 text-center">🟡 Orta-hassas</td><td className="border border-gray-200 p-2">Küçük-orta sapmalar alarm üretir</td></tr>
              <tr><td className="border border-gray-200 p-2 text-center font-bold bg-blue-50">2σ (varsayılan)</td><td className="border border-gray-200 p-2 text-center font-mono font-bold">0.093 + 0.088 = 0.181</td><td className="border border-gray-200 p-2 text-center">🟡 Dengeli</td><td className="border border-gray-200 p-2 font-semibold">İstatistiksel olarak anlamlı sapmaları yakalar</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 text-center font-bold">2.5σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0.110 = 0.203</td><td className="border border-gray-200 p-2 text-center">🟢 Düşük-orta</td><td className="border border-gray-200 p-2">Orta-ciddi sapmalar alarm üretir</td></tr>
              <tr><td className="border border-gray-200 p-2 text-center font-bold">3σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0.132 = 0.225</td><td className="border border-gray-200 p-2 text-center">🟢 Düşük</td><td className="border border-gray-200 p-2">Sadece ciddi anomaliler alarm üretir</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 p-2 text-center font-bold">3.5σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0.154 = 0.247</td><td className="border border-gray-200 p-2 text-center">🔵 Çok düşük</td><td className="border border-gray-200 p-2">Aşırı uç değerler için</td></tr>
              <tr><td className="border border-gray-200 p-2 text-center font-bold">4σ</td><td className="border border-gray-200 p-2 text-center font-mono">0.093 + 0.176 = 0.269</td><td className="border border-gray-200 p-2 text-center">🔵 En düşük</td><td className="border border-gray-200 p-2">Neredeyse hiç alarm üretmez</td></tr>
            </tbody>
          </table>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800 mt-3">
          <strong>💡 Öneri:</strong> Genel kullanım için <strong>2σ</strong> önerilir.
          Eğer çok fazla alarm görüyorsanız 2.5σ veya 3σ'ya çıkabilirsiniz.
          Tüm riskleri görmek istiyorsanız 1σ veya 1.5σ'ya düşürebilirsiniz.
          Sigma ayarı tüm analizleri (Component, ATA, Aircraft ve General Alert) eş zamanlı etkiler.
        </div>
      </Section>
    </div>
  );
}
