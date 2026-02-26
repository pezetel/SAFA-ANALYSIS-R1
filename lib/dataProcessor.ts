import { SAFARecord } from './types';

const COLUMN_ALIASES = {
  woNumber: ['w/o number', 'wo number', 'work order', 'wo', 'w/o'],
  date: ['w/o date', 'wo date', 'date', 'tarih'],
  ata: ['ata', 'ata code', 'ata chapter'],
  aircraft: ['a/c', 'ac', 'aircraft', 'registration', 'tail number'],
  paragraph: ['paragraph no', 'paragraph', 'parag', 'parag no'],
  description: ['description', 'aciklama', 'finding', 'desc'],
};

export function processExcelData(rawData: any[]): SAFARecord[] {
  if (!rawData || rawData.length === 0) {
    throw new Error('Excel dosyasi bos veya gecersiz');
  }

  const normalizedData = rawData.map(row => {
    const normalizedRow: any = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.trim().toLowerCase();
      normalizedRow[normalizedKey] = row[key];
    });
    return normalizedRow;
  });

  const firstRow = normalizedData[0];
  const columnMap: Record<string, string> = {};

  Object.entries(COLUMN_ALIASES).forEach(([targetKey, aliases]) => {
    for (const alias of aliases) {
      if (firstRow.hasOwnProperty(alias)) {
        columnMap[targetKey] = alias;
        break;
      }
    }
  });

  if (!columnMap.date) {
    throw new Error('Tarih kolonu bulunamadi (W/O Date)');
  }
  if (!columnMap.description) {
    throw new Error('Aciklama kolonu bulunamadi (Description)');
  }

  const records: SAFARecord[] = [];

  normalizedData.forEach((row, index) => {
    try {
      const woNumber = row[columnMap.woNumber || ''] || `AUTO-${index + 1}`;
      const dateStr = row[columnMap.date];
      const ata = normalizeATA(row[columnMap.ata || '']);
      const aircraft = normalizeAircraft(row[columnMap.aircraft || '']);
      const paragraph = row[columnMap.paragraph || ''] || '';
      const description = row[columnMap.description] || '';

      if (!dateStr || !description) {
        return;
      }

      const date = parseDate(dateStr);
      if (!date) {
        return;
      }

      const cleanDescription = cleanDesc(description);
      const problemType = extractProblemType(cleanDescription);
      const component = extractComponent(cleanDescription);
      const severity = extractSeverity(description);

      records.push({
        woNumber: String(woNumber),
        date,
        ata,
        aircraft,
        paragraph: String(paragraph),
        originalDescription: description,
        cleanDescription,
        problemType,
        component,
        severity,
      });
    } catch (error) {
      console.warn(`Error processing row ${index + 1}:`, error);
    }
  });

  if (records.length === 0) {
    throw new Error('Islenebilir veri bulunamadi');
  }

  return records;
}

function normalizeAircraft(value: any): string {
  if (!value) return 'UNKNOWN';
  const str = String(value).trim().toUpperCase();
  return str || 'UNKNOWN';
}

function normalizeATA(value: any): string {
  if (!value) return 'UNKNOWN';
  const str = String(value).trim();
  if (/^\d{2}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (/^\d{2}-\d{2}$/.test(str)) {
    return str + '-00';
  }
  if (/^\d{2}$/.test(str)) {
    return str + '-00-00';
  }
  return str || 'UNKNOWN';
}

function parseDate(dateStr: any): Date | null {
  if (!dateStr) return null;

  const ddmmyyyyMatch = String(dateStr).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function cleanDesc(text: string): string {
  if (!text) return '';

  let cleaned = String(text).toUpperCase();
  cleaned = cleaned.replace(/\s+/g, ' ');

  cleaned = cleaned.replace(/FINDING\s*\(NRC[^)]*\)\s*DOCUMENT\s+EOD[-\sA-Z0-9]*R00/g, ' ');
  cleaned = cleaned.replace(/FINDING\s*\(NRC[^)]*\)/g, ' ');
  cleaned = cleaned.replace(/DOCUMENT\s+EOD[-\sA-Z0-9]*R00/g, ' ');

  cleaned = cleaned.replace(/\bPARAG(?:RAPH|RPH|PH)?\s+NO\.?\s*[A-Z0-9]+\b/g, ' ');
  cleaned = cleaned.replace(/\bPARAG(?:RAPH|RPH|PH)?\s*[A-Z0-9]+\b/g, ' ');

  cleaned = cleaned.replace(/\bNRC[-\dA-Z]+\b/g, ' ');

  cleaned = cleaned.replace(/\b(W\/O|WO|WP|TC)\s*[:\-]?\s*\d+\b/g, ' ');

  cleaned = cleaned.replace(/\bMAINT\s+ENTRY\b/g, ' ');

  cleaned = cleaned.replace(/\bDURING\s+(?:THE\s+)?EXTERIOR\s+SAFA\b.*?(CHECK|INSPECTION|GVI)\b/g, ' ');
  cleaned = cleaned.replace(/\bDURING\s+(?:THE\s+)?SAFA\b.*?(CHECK|INSPECTION|GVI)\b/g, ' ');

  cleaned = cleaned.replace(/\bEXTERIOR\s+SAFA\s+CHECK\b/g, ' ');
  cleaned = cleaned.replace(/\bEXTERIOR\s+SAFA\s+INSPECTION\b/g, ' ');

  cleaned = cleaned.replace(/\bDURING\s+PERFORM(?:ED)?\b/g, ' ');
  cleaned = cleaned.replace(/\bDURING\s+W\/O\s*\d+\b/g, ' ');
  cleaned = cleaned.replace(/\bDURING\s+THE\s+/g, ' ');
  cleaned = cleaned.replace(/^DURING\s+/g, ' ');

  cleaned = cleaned.replace(/FOND /g, 'FOUND ');

  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

function extractProblemType(description: string): string {
  const text = description.toUpperCase();

  const problemTypes = [
    // Paint damage once kontrol et
    { keywords: ['PAINT DAMAGE', 'PAINT DAMAGED', 'PAINTING DAMAGE'], type: 'PAINT_DAMAGE' },
    { keywords: ['MISSING', 'MISS'], type: 'MISSING' },
    { keywords: ['DAMAGED', 'DAMAGE', 'CRACK', 'BROKEN', 'TORN', 'WORN'], type: 'DAMAGED' },
    { keywords: ['LOOSE', 'NOT FIXED'], type: 'LOOSE' },
    { keywords: ['INOP', 'NOT WORKING', 'NOT ILLUMINATE', 'NOT FUNCTIONING', 'FAULTY'], type: 'INOPERATIVE' },
    { keywords: ['DIRTY'], type: 'CLEANLINESS' },
    { keywords: ['LOW'], type: 'LOW_LEVEL' },
    { keywords: ['ADJUSTMENT', 'OUT OF ADJUSTMENT'], type: 'ADJUSTMENT' },
  ];

  for (const { keywords, type } of problemTypes) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return type;
    }
  }

  return 'OTHER';
}

function extractComponent(description: string): string {
  const text = description.toUpperCase();

  const components = [
    { keywords: ['OVERHEAD BIN', 'STOWAGE BIN', 'OVERHEAD STOWAGE'], component: 'OVERHEAD_BIN' },
    { keywords: ['BIN STOPPER', 'DOOR STOPPER'], component: 'BIN_STOPPER' },
    { keywords: ['TRAY TABLE'], component: 'TRAY_TABLE' },
    { keywords: ['PAX SEAT', 'PASSENGER SEAT', 'ATTENDANT SEAT'], component: 'SEAT' },
    { keywords: ['SEAT BELT', 'SAFETY HARNESS', 'SAFETY BELT'], component: 'SEAT_BELT' },
    { keywords: ['READING LIGHT', 'FLOOD LIGHT', 'LIGHT LENS'], component: 'LIGHT' },
    { keywords: ['LIFE VEST'], component: 'LIFE_VEST' },
    { keywords: ['LAVATORY', 'LAV A', 'LAV B', 'LAV C', 'LAV D', 'LAV E'], component: 'LAVATORY' },
    { keywords: ['GALLEY'], component: 'GALLEY' },
    { keywords: ['PLACARD'], component: 'PLACARD' },
    { keywords: ['SUNSHADE'], component: 'SUNSHADE' },
    { keywords: ['CURTAIN'], component: 'CURTAIN' },
    { keywords: ['OXYGEN', 'OXY BOTTLE'], component: 'OXYGEN' },
    { keywords: ['MIRROR'], component: 'MIRROR' },
    { keywords: ['CARPET', 'FLOOR MAT'], component: 'CARPET' },
    { keywords: ['CARGO NET', 'CARGO NETS', 'NET', 'NETS'], component: 'CARGO_NETS' },
    { keywords: ['CARGO TAPE', 'CARGO TAPES'], component: 'CARGO_TAPES' },
    { keywords: ['ANTENNA'], component: 'ANTENNA' },
    // Kruger Flap ve diger yapisal parcalar ENGINE'den once
    { keywords: ['KRUGER FLAP', 'KRUGER'], component: 'KRUGER_FLAP' },
    { keywords: ['SLAT'], component: 'SLAT' },
    { keywords: ['FLAP'], component: 'FLAP' },
    // Engine kontrolu - sadece gercek engine parcalari
    { keywords: ['#1 ENGINE', '#2 ENGINE', '#1 ENG', '#2 ENG', 'ENGINE COWL', 'FAN BLADE', 'ENGINE PYLON', 'ENG'], component: 'ENGINE' },
    { keywords: ['LANDING LIGHT', 'LANDING GEAR'], component: 'LANDING_GEAR' },
    { keywords: ['WATER SERVICE', 'POTABLE WATER', 'PORTABLE WATER'], component: 'WATER_SYSTEM' },
    { keywords: ['BONDING WIRE', 'BONDING'], component: 'BONDING' },
    { keywords: ['HINGE'], component: 'HINGE' },
    { keywords: ['LATCH'], component: 'LATCH' },
    // Spesifik panel turleri
    { keywords: ['FLOOR PANEL'], component: 'FLOOR_PANEL' },
    { keywords: ['CEILING PANEL'], component: 'CEILING_PANEL' },
    { keywords: ['DOOR PANEL'], component: 'DOOR_PANEL' },
    { keywords: ['SIDE PANEL', 'WALL PANEL'], component: 'SIDE_PANEL' },
    { keywords: ['TRIM PANEL'], component: 'TRIM_PANEL' },
    // Genel panel (eger spesifik eslesme yoksa)
    { keywords: ['PANEL', 'TRIM'], component: 'PANEL' },
    { keywords: ['SEAT'], component: 'SEAT' },
    { keywords: ['DOOR'], component: 'DOOR' },
    { keywords: ['LIGHT'], component: 'LIGHT' },
  ];

  for (const { keywords, component } of components) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return component;
    }
  }

  return 'OTHER';
}

function extractSeverity(description: string): string {
  const text = description.toUpperCase();
  const nrcMatch = text.match(/NRC(\d+)?/);
  if (nrcMatch) {
    return nrcMatch[1] ? `NRC${nrcMatch[1]}` : 'NRC';
  }
  return 'NRC';
}
