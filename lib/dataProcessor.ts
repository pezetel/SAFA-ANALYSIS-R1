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
    throw new Error('Excel file is empty or invalid');
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
    throw new Error('Date column not found (W/O Date)');
  }
  if (!columnMap.description) {
    throw new Error('Description column not found (Description)');
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
    throw new Error('No processable data found');
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

  cleaned = cleaned.replace(/FINDING\s*\(NRC\d*[^)]*\)\s*/gi, '');
  cleaned = cleaned.replace(/DOCUMENT\s+EOD[-\sA-Z0-9]+R\d{2}\s*/gi, '');
  cleaned = cleaned.replace(/PARAG(?:RAPH)?\.?\s*NUMBER\s+[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARAG(?:RAPH|RPH|PH|H)?\.?\s*NO\s*\.?\s*:?\s*[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARAGNO\s*:?\s*[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARG\.?\s*[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARA\.?\s+NO\s+[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARA\.?\s+[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARAGPH\.?\s*[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/PARAG(?:RAPH|RPH|PH|H)?\.?\s*[A-Z][.:\s]*\d{2}\.?\s*/gi, '');
  cleaned = cleaned.replace(/\bNRC\d*[-\dA-Z]*\b\s*/g, '');
  cleaned = cleaned.replace(/\b(W\/O|WO|WP|TC)\s*[:\-]?\s*\d+\b\s*/g, '');
  cleaned = cleaned.replace(/\bMAINT\s+ENTRY\b\s*/g, '');
  cleaned = cleaned.replace(/\bDURING\s+(?:THE\s+)?EXTERIOR\s+SAFA\b.*?(CHECK|INSPECTION|GVI)\b\s*/g, '');
  cleaned = cleaned.replace(/\bDURING\s+(?:THE\s+)?SAFA\b.*?(CHECK|INSPECTION|GVI)\b\s*/g, '');
  cleaned = cleaned.replace(/\bDURING\s+PE?RF?[OR]*M[ED]*\s*,?\s*/gi, '');
  cleaned = cleaned.replace(/\bDURING\s+PERFORM(?:ED)?\b\s*/g, '');
  cleaned = cleaned.replace(/\bEXTERIOR\s+SAFA\s+CHECK\b\s*/g, '');
  cleaned = cleaned.replace(/\bEXTERIOR\s+SAFA\s+INSPECTION\b\s*/g, '');
  cleaned = cleaned.replace(/\bDURING\s+W\/O\s*\d+\b\s*/g, '');
  cleaned = cleaned.replace(/\bDURING\s+THE\s+/g, '');
  cleaned = cleaned.replace(/^DURING\s+/g, '');
  cleaned = cleaned.replace(/FOND /g, 'FOUND ');
  cleaned = cleaned.replace(/NOR WORKING/g, 'NOT WORKING');
  cleaned = cleaned.replace(/MISISING/g, 'MISSING');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

function extractProblemType(description: string): string {
  const text = description.toUpperCase();

  const problemTypes = [
    {
      type: 'DENT',
      keywords: [
        'DENT',
        'DENTED',
      ],
    },
    {
      type: 'PAINT_DAMAGE',
      keywords: [
        'PAINT DAMAGE',
        'PAINT DAMAGED',
        'PAINTING DAMAGE',
        'PAINT DAMAGES',
        'PAINT DMG',
        'PEELED OF PAINT',
        'PEELED OFF PAINT',
        'PAINTDAMAGE',
      ],
    },
    {
      type: 'MISSING',
      keywords: [
        'MISSING',
        'MISS',
      ],
    },
    {
      type: 'DAMAGED',
      keywords: [
        'DAMAGED',
        'DAMAGE',
        'CRACK',
        'BROKEN',
        'TORN',
        'WORN',
      ],
    },
    {
      type: 'LOOSE',
      keywords: [
        'LOOSE',
        'NOT FIXED',
      ],
    },
    {
      type: 'INOPERATIVE',
      keywords: [
        'INOP',
        'NOT WORKING',
        'NOT ILLUMINATE',
        'NOT FUNCTIONING',
        'FAULTY',
      ],
    },
    {
      type: 'CLEANLINESS',
      keywords: [
        'DIRTY',
      ],
    },
    {
      type: 'ADJUSTMENT',
      keywords: [
        'ADJUSTMENT',
        'OUT OF ADJUSTMENT',
      ],
    },
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
    // Antiskating Foil (incl. typos: antistating, outflow valve foil)
    {
      component: 'ANTISKATING_FOIL',
      keywords: [
        'ANTISKATING FOIL',
        'ANTISKATINGFOIL',
        'ANTISTATINGFOIL',
        'OUTFLOW VALVE FOIL',
        'OUTFLOW VALVE ANTISTATING',
      ],
    },
    // Landing Gear - Oil Charging Valve (with all known typo variations)
    {
      component: 'LG_OIL_CHARGING_VALVE',
      keywords: [
        'OIL SERVICING CHARGING',
        'OIL SERVICING CHARGER',
        'OIL CHARGING VALVE',
        'OIL CHARHING VALVE',
        'OIL CHARGINGVALVE',
        'OIL CHARHINGVALUE',
        'OIL CHARGING',
        'OIL CHARGIN',
        'OILCHARGING',
      ],
    },
    // Fuselage Skin (skin panels, butt joints, body fairings)
    {
      component: 'FUSELAGE_SKIN',
      keywords: [
        'FUS SKIN',
        'FUSELAGE SKIN',
        'BUTT JOINT SEALANT',
        'BODY FAIRING',
        'BODYFAIRING',
      ],
    },
    // Scuff Plate
    {
      component: 'SCUFF_PLATE',
      keywords: [
        'SCUFF PLATE',
        'SCUFF PLATE FILLER',
      ],
    },
    // Security Box
    {
      component: 'SECURITY_BOX',
      keywords: [
        'SECURITY BOX',
      ],
    },
    // Blade Seal
    {
      component: 'BLADE_SEAL',
      keywords: [
        'BLADE SEAL',
        'BLADE SEALS',
      ],
    },
    // Drain Mast
    {
      component: 'DRAIN_MAST',
      keywords: [
        'DRAIN MAST',
      ],
    },
    // Vapor Barrier
    {
      component: 'VAPOR_BARRIER',
      keywords: [
        'VAPOR BARRIER',
      ],
    },
    // Bonding (including jumper wires, anchor plates)
    {
      component: 'BONDING',
      keywords: [
        'JUMPER',
        'BONDING WIRE',
        'BONDING',
      ],
    },
    // Lanyard Ring (with apostrophe variations, lanyard assy, line yard typo)
    // NOTE: Standalone "RING"/"RINGS" is handled as a fallback at the end.
    //       If RING appears with CARGO in the same description → LANYARD_RING
    //       Cargo nets are already caught above by "CARGO NET"/"CARGO NETS".
    {
      component: 'LANYARD_RING',
      keywords: [
        'LANYARD RING',
        'LANYARDS RING',
        'LANYARD\'S RING',
        'LANYARDS RINGS',
        'LANYARD RINGS',
        'LANYARD ASSY',
        'LINE YARD',
        'LANYARD',
      ],
    },
    // Horizontal Stabilizer
    {
      component: 'HORIZONTAL_STABILIZER',
      keywords: [
        'HORIZONTAL STAB',
        'HORIZONTAL STABILIZER',
        'HORIZONTAL STABILISER',
      ],
    },
    // Overhead Bin
    {
      component: 'OVERHEAD_BIN',
      keywords: [
        'OVERHEAD BIN',
        'STOWAGE BIN',
        'OVERHEAD STOWAGE',
      ],
    },
    // Bin Stopper
    {
      component: 'BIN_STOPPER',
      keywords: [
        'BIN STOPPER',
        'DOOR STOPPER',
      ],
    },
    // Tray Table
    {
      component: 'TRAY_TABLE',
      keywords: [
        'TRAY TABLE',
      ],
    },
    // Seat Belt
    {
      component: 'SEAT_BELT',
      keywords: [
        'SEAT BELT',
        'SAFETY HARNESS',
        'SAFETY BELT',
      ],
    },
    // Light (specific types first)
    {
      component: 'LIGHT',
      keywords: [
        'READING LIGHT',
        'FLOOD LIGHT',
        'LIGHT LENS',
        'LANDING LIGHT',
      ],
    },
    // Life Vest
    {
      component: 'LIFE_VEST',
      keywords: [
        'LIFE VEST',
      ],
    },
    // Placard (incl. stickers, stencils, labels, danger stickers)
    {
      component: 'PLACARD',
      keywords: [
        'PLACARD',
        'PLACRDS',
        'STICKER',
        'STENCIL',
        'LABEL',
      ],
    },
    // Lavatory
    {
      component: 'LAVATORY',
      keywords: [
        'LAVATORY',
        'LAV A',
        'LAV B',
        'LAV C',
        'LAV D',
        'LAV E',
      ],
    },
    // Galley
    {
      component: 'GALLEY',
      keywords: [
        'GALLEY',
      ],
    },
    // Sunshade
    {
      component: 'SUNSHADE',
      keywords: [
        'SUNSHADE',
        'WINDOW SHADE',
        'PAX WINDOW SHADE',
        'WINDOW SHADES',
      ],
    },
    // Curtain
    {
      component: 'CURTAIN',
      keywords: [
        'CURTAIN',
      ],
    },
    // Oxygen
    {
      component: 'OXYGEN',
      keywords: [
        'OXYGEN',
        'OXY BOTTLE',
      ],
    },
    // Mirror
    {
      component: 'MIRROR',
      keywords: [
        'MIRROR',
      ],
    },
    // Carpet
    {
      component: 'CARPET',
      keywords: [
        'CARPET',
        'FLOOR MAT',
      ],
    },
    // Cargo Nets
    {
      component: 'CARGO_NETS',
      keywords: [
        'CARGO NET',
        'CARGO NETS',
      ],
    },
    // Cargo Tapes (incl. lining tapes, glass fabric, tappes typo)
    {
      component: 'CARGO_TAPES',
      keywords: [
        'AFT CARGO COMPARTMENT TAPE',
        'CARGO PANEL TAPE',
        'SIDE WALL PANEL TAPE',
        'CARGO LINING TAPE',
        'CARGO SOME TAPE',
        'CARGO SOME TAPES',
        'CARGOS TAPE',
        'CARGOS TAPES',
        'SIDE WALL TAPE',
        'SIDEWALL TAPE',
        'CARGO SIDEWALL TAPE',
        'CARGO TAPE',
        'CARGO TAPES',
        'CARGOTAPES',
        'CARGO TAPPES',
      ],
    },
    // Antenna
    {
      component: 'ANTENNA',
      keywords: [
        'ANTENNA',
      ],
    },
    // Kruger Flap
    {
      component: 'KRUGER_FLAP',
      keywords: [
        'KRUGER FLAP',
        'KRUGER',
      ],
    },
    // Slat
    {
      component: 'SLAT',
      keywords: [
        'SLAT',
      ],
    },
    // Flap
    {
      component: 'FLAP',
      keywords: [
        'FLAP',
      ],
    },
    // Engine
    {
      component: 'ENGINE',
      keywords: [
        '#1 ENGINE',
        '#2 ENGINE',
        '#1 ENG',
        '#2 ENG',
        'ENGINE COWL',
        'FAN BLADE',
        'ENGINE PYLON',
        'ENG',
      ],
    },
    // Landing Gear (incl. tire, shock strut, wheel well, brake unit, MLG, NLG)
    {
      component: 'LANDING_GEAR',
      keywords: [
        'LANDING GEAR',
        'TIRE',
        'SHOCK STRUT',
        'SHOCK CHARGING',
        'WHEEL WELL',
        'BRAKE UNIT',
        'MLG',
        'NLG',
      ],
    },
    // Water System
    {
      component: 'WATER_SYSTEM',
      keywords: [
        'WATER SERVICE',
        'POTABLE WATER',
        'PORTABLE WATER',
      ],
    },
    // Hinge
    {
      component: 'HINGE',
      keywords: [
        'HINGE',
      ],
    },
    // Latch
    {
      component: 'LATCH',
      keywords: [
        'LATCH',
      ],
    },
    // Floor Panel
    {
      component: 'FLOOR_PANEL',
      keywords: [
        'FLOOR PANEL',
      ],
    },
    // Ceiling Panel
    {
      component: 'CEILING_PANEL',
      keywords: [
        'CEILING PANEL',
      ],
    },
    // Door Panel
    {
      component: 'DOOR_PANEL',
      keywords: [
        'DOOR PANEL',
      ],
    },
    // Side Panel
    {
      component: 'SIDE_PANEL',
      keywords: [
        'SIDE PANEL',
        'WALL PANEL',
      ],
    },
    // Trim Panel
    {
      component: 'TRIM_PANEL',
      keywords: [
        'TRIM PANEL',
      ],
    },
    // Panel (generic - must be after specific panels)
    {
      component: 'PANEL',
      keywords: [
        'PANEL',
        'TRIM',
      ],
    },
    // Seat (must be after seat belt)
    {
      component: 'SEAT',
      keywords: [
        'PAX SEAT',
        'PASSENGER SEAT',
        'ATTENDANT SEAT',
      ],
    },
    {
      component: 'SEAT',
      keywords: [
        'SEAT',
      ],
    },
    // Door
    {
      component: 'DOOR',
      keywords: [
        'DOOR',
      ],
    },
    // Light (generic - must be last, uses word boundary)
    {
      component: 'LIGHT',
      keywords: [
        '\bLIGHT\b',
      ],
    },
  ];

  // Main keyword loop — check all explicit multi-word and single-word keywords
  for (const { keywords, component } of components) {
    if (keywords.some(keyword => {
      if (keyword === '\\bLIGHT\\b') {
        return /\bLIGHT\b/.test(text);
      }
      return text.includes(keyword);
    })) {
      return component;
    }
  }

  // --- Standalone "RING" / "RINGS" fallback ---
  // If none of the explicit keywords above matched, check for "RING" or "RINGS".
  // Only classify if CARGO is ALSO present in the description — this catches
  // cargo-related ring findings like "CARGO COMPARTMENT RING DAMAGED",
  // "CARGO RING MISSING", "AFT CARGO SPLIT RING" etc. that weren't caught
  // by the more specific CARGO_NET/CARGO_TAPES keywords above.
  // Without CARGO context, a standalone RING is too ambiguous to auto-classify.
  if (/\bRINGS?\b/.test(text) && text.includes('CARGO')) {
    return 'LANYARD_RING';
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
