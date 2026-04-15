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

/**
 * Normalize aircraft registration to a consistent format.
 * Must match the normalizeAircraftReg logic in eodProcessor.ts so that
 * SAFA records and EOD records use identical aircraft keys.
 *
 * Rules:
 *  - 3-letter code (e.g. "SEK") → "TC-SEK"
 *  - 5-letter without dash (e.g. "TCSEK") → "TC-SEK"
 *  - Already "TC-XXX" → kept as-is
 *  - Everything else → trimmed & uppercased
 */
function normalizeAircraft(value: any): string {
  if (!value) return 'UNKNOWN';
  let str = String(value).trim().toUpperCase();
  if (!str) return 'UNKNOWN';

  // 3-letter code like "SEK" → "TC-SEK"
  if (/^[A-Z]{3}$/.test(str)) {
    return 'TC-' + str;
  }

  // Already in TC-XXX format
  if (/^TC-[A-Z]{3}$/.test(str)) {
    return str;
  }

  // 5-letter without dash like "TCSEK" → "TC-SEK"
  if (/^TC[A-Z]{3}$/.test(str)) {
    return str.slice(0, 2) + '-' + str.slice(2);
  }

  return str;
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
    { keywords: ['DENT', 'DENTED'], type: 'DENT' },
    { keywords: ['PAINT DAMAGE', 'PAINT DAMAGED', 'PAINTING DAMAGE', 'PAINT DAMAGES', 'PAINT DMG', 'PEELED OF PAINT', 'PEELED OFF PAINT', 'PAINTDAMAGE'], type: 'PAINT_DAMAGE' },
    { keywords: ['EXPIRE DATE', 'EXPIRED', 'EXPIRE'], type: 'EXPIRED' },
    { keywords: ['MISSING', 'MISS'], type: 'MISSING' },
    { keywords: ['DAMAGED', 'DAMAGE', 'CRACK', 'BROKEN', 'TORN', 'WORN', 'BAD CONDITION', 'NEED TO BE REPLACE', 'NEEDS REPLACEMENT', 'NEED REPLACEMENT'], type: 'DAMAGED' },
    { keywords: ['LOOSE', 'NOT FIXED', 'NOT ATTACHED', 'NOT SECURED'], type: 'LOOSE' },
    { keywords: ['INOP', 'NOT WORKING', 'NOT ILLUMINATE', 'NOT FUNCTIONING', 'FAULTY', 'DOESNT MOVE', 'DOES NOT MOVE', 'DONT LOCK', "DON'T LOCK", 'DON T LOCK', 'NOT OPERATE', 'NOT OPERATING', 'DEFECTIVE', 'WEAK', 'NOT WORK', 'U/S'], type: 'INOPERATIVE' },
    { keywords: ['DIRTY', 'NEEDS TO BE CLEAN', 'NEEDS CLEANING', 'NEED TO BE CLEAN'], type: 'CLEANLINESS' },
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

  // ─────────────────────────────────────────────────────────────────────────────
  // LIGHT must be checked EARLY so that descriptions containing light-related
  // keywords are not swallowed by MIRROR, LAVATORY, SEAT, DOOR, OVERHEAD_BIN,
  // SEAT_BELT etc.  Any description mentioning a light/lamp/bulb/illumination
  // problem should land here FIRST.
  // ─────────────────────────────────────────────────────────────────────────────
  const lightKeywords = [
    'READING LIGHT', 'FLOOD LIGHT', 'LIGHT LENS', 'LANDING LIGHT',
    'READING BULB', 'SIGN LAMP', 'FLUORESCENT LAMP', 'CEILING LIGHT',
    'INDICATION LAMP', 'READING LENS', 'MIRROR LIGHT', 'EMERGENCY LIGHT',
    'SEAT BELT LIGHT', 'FASTEN SEAT BELT LIGHT', 'WINDOW LIGHT',
    'OVERHEAD BIN LIGHT', 'BIN LIGHT', 'CABIN LIGHT', 'COCKPIT LIGHT',
    'DOOR LIGHT', 'EXIT LIGHT', 'LOGO LIGHT', 'NAV LIGHT',
    'NAVIGATION LIGHT', 'STROBE LIGHT', 'TAXI LIGHT', 'WING LIGHT',
    'BEACON LIGHT', 'ANTI COLLISION LIGHT', 'POSITION LIGHT',
    'DOME LIGHT', 'COURTESY LIGHT', 'ENTRY LIGHT',
    'LIGHT SHADE', 'LIGHT COVER', 'LIGHT ASSY',
    'LIGHT BULB', 'LIGHT INOP', "LIGHT'S", 'LIGHTS ARE',
    'LIGHTS INOP', 'LIGHTS U/S', 'LIGHT U/S', 'LIGHT IS U/S',
    'LAMP INOP', 'LAMP U/S', 'BULB INOP', 'BULB U/S',
    'LIGHT NOT WORKING', 'LAMP NOT WORKING',
    'SERVICE DOOR EMERGENCY LIGHT',
  ];

  // Check if description is primarily about a LIGHT issue
  if (lightKeywords.some(keyword => text.includes(keyword))) {
    return 'LIGHT';
  }

  // Also catch generic "LIGHT" when it appears with action words indicating
  // the light itself is the subject (not just a modifier)
  if (/\bLIGHT\b/.test(text) && /\b(INOP|U\/S|MISSING|BROKEN|DAMAGED|NOT WORKING|FAULTY|DEFECTIVE|FOUND|REPLACE)\b/.test(text)) {
    return 'LIGHT';
  }
  if (/\bLAMP\b/.test(text) && /\b(INOP|U\/S|MISSING|BROKEN|DAMAGED|NOT WORKING|FAULTY|DEFECTIVE|FOUND|REPLACE)\b/.test(text)) {
    return 'LIGHT';
  }
  if (/\bBULB\b/.test(text) && /\b(INOP|U\/S|MISSING|BROKEN|DAMAGED|NOT WORKING|FAULTY|DEFECTIVE|FOUND|REPLACE)\b/.test(text)) {
    return 'LIGHT';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Remaining components in priority order (LIGHT already handled above)
  // ─────────────────────────────────────────────────────────────────────────────
  const components = [
    { keywords: ['ANTISKATING FOIL', 'ANTISKATINGFOIL', 'ANTISTATINGFOIL', 'OUTFLOW VALVE FOIL', 'OUTFLOW VALVE ANTISTATING'], component: 'ANTISKATING_FOIL' },
    { keywords: ['OIL SERVICING CHARGING', 'OIL SERVICING CHARGER', 'OIL CHARGING VALVE', 'OIL CHARHING VALVE', 'OIL CHARGINGVALVE', 'OIL CHARHINGVALUE', 'OIL CHARGING', 'OIL CHARGIN', 'OILCHARGING'], component: 'LG_OIL_CHARGING_VALVE' },
    { keywords: ['FUS SKIN', 'FUSELAGE SKIN', 'BUTT JOINT SEALANT', 'BODY FAIRING', 'BODYFAIRING'], component: 'FUSELAGE_SKIN' },
    { keywords: ['SCUFF PLATE', 'SCUFF PLATE FILLER'], component: 'SCUFF_PLATE' },
    { keywords: ['SECURITY BOX'], component: 'SECURITY_BOX' },
    { keywords: ['BLADE SEAL', 'BLADE SEALS'], component: 'BLADE_SEAL' },
    { keywords: ['DRAIN MAST'], component: 'DRAIN_MAST' },
    { keywords: ['VAPOR BARRIER'], component: 'VAPOR_BARRIER' },
    { keywords: ['JUMPER', 'BONDING WIRE', 'BONDING'], component: 'BONDING' },
    { keywords: ['LANYARD RING', 'LANYARDS RING', "LANYARD'S RING", 'LANYARDS RINGS', 'LANYARD RINGS', 'LANYARD ASSY', 'LINE YARD', 'LANYARD'], component: 'LANYARD_RING' },
    { keywords: ['HORIZONTAL STAB', 'HORIZONTAL STABILIZER', 'HORIZONTAL STABILISER'], component: 'HORIZONTAL_STABILIZER' },
    { keywords: ['FIRST AID KIT', 'FIRST AIT KIT', 'FAK'], component: 'FIRST_AID_KIT' },
    { keywords: ['FLASHLIGHT', 'FLASHLIGH', 'FLISHLIGHT', 'ETL', 'TORCH'], component: 'FLASHLIGHT' },
    { keywords: ['OVERHEAD BIN', 'STOWAGE BIN', 'OVERHEAD STOWAGE', 'BIN STOPPER', 'DOOR STOPPER', 'STOPPER', 'BIN STOP', 'BIN STOPS', 'BAGGAGE BAR'], component: 'OVERHEAD_BIN' },
    { keywords: ['FOOD TRAY', 'TRAY TABLE', 'BABY TABLE'], component: 'TRAY_TABLE' },
    { keywords: ['SEAT BELT', 'SAFETY HARNESS', 'SAFETY BELT'], component: 'SEAT_BELT' },
    { keywords: ['LIFE VEST'], component: 'LIFE_VEST' },
    { keywords: ['PLACARD', 'PLACRDS', 'STICKER', 'STENCIL', 'LABEL'], component: 'PLACARD' },
    { keywords: ['LAVATORY', 'LAV A', 'LAV B', 'LAV C', 'LAV D', 'LAV E', 'SOAP DISPENSER', 'SOAP DISPENCER', 'WASH BASIN', 'TOILET', 'TOILET SHROUD'], component: 'LAVATORY' },
    { keywords: ['GALLEY'], component: 'GALLEY' },
    { keywords: ['SUNSHADE', 'WINDOW SHADE', 'PAX WINDOW SHADE', 'WINDOW SHADES', 'WINDOWSHADE', 'SUNSHEAD', 'SUN SHADE'], component: 'SUNSHADE' },
    { keywords: ['CURTAIN'], component: 'CURTAIN' },
    { keywords: ['OXYGEN', 'OXY BOTTLE'], component: 'OXYGEN' },
    { keywords: ['MIRROR'], component: 'MIRROR' },
    { keywords: ['CARPET', 'FLOOR MAT'], component: 'CARPET' },
    { keywords: ['CARGO NET', 'CARGO NETS'], component: 'CARGO_NETS' },
    { keywords: ['AFT CARGO COMPARTMENT TAPE', 'CARGO PANEL TAPE', 'SIDE WALL PANEL TAPE', 'CARGO LINING TAPE', 'CARGO SOME TAPE', 'CARGO SOME TAPES', 'CARGOS TAPE', 'CARGOS TAPES', 'SIDE WALL TAPE', 'SIDEWALL TAPE', 'CARGO SIDEWALL TAPE', 'CARGO TAPE', 'CARGO TAPES', 'CARGOTAPES', 'CARGO TAPPES'], component: 'CARGO_TAPES' },
    { keywords: ['ANTENNA'], component: 'ANTENNA' },
    { keywords: ['KRUGER FLAP', 'KRUGER'], component: 'KRUGER_FLAP' },
    { keywords: ['SLAT'], component: 'SLAT' },
    { keywords: ['FLAP'], component: 'FLAP' },
    { keywords: ['#1 ENGINE', '#2 ENGINE', '#1 ENG', '#2 ENG', 'ENGINE COWL', 'FAN BLADE', 'ENGINE PYLON', 'ENG'], component: 'ENGINE' },
    { keywords: ['LANDING GEAR', 'TIRE', 'SHOCK STRUT', 'SHOCK CHARGING', 'WHEEL WELL', 'BRAKE UNIT', 'MLG', 'NLG', 'L/G', 'LG PIN', 'SAFETY PIN'], component: 'LANDING_GEAR' },
    { keywords: ['WATER SERVICE', 'POTABLE WATER', 'PORTABLE WATER'], component: 'WATER_SYSTEM' },
    { keywords: ['HINGE'], component: 'HINGE' },
    { keywords: ['LATCH', 'LOCKING PLATE', 'LOCK MECHANISM'], component: 'LATCH' },
    { keywords: ['FLOOR PANEL'], component: 'FLOOR_PANEL' },
    { keywords: ['CEILING PANEL'], component: 'CEILING_PANEL' },
    { keywords: ['DOOR PANEL'], component: 'DOOR_PANEL' },
    { keywords: ['SIDE PANEL', 'WALL PANEL'], component: 'SIDE_PANEL' },
    { keywords: ['TRIM PANEL'], component: 'TRIM_PANEL' },
    { keywords: ['PANEL', 'TRIM'], component: 'PANEL' },
    { keywords: ['PAX SEAT', 'PASSENGER SEAT', 'ATTENDANT SEAT'], component: 'SEAT' },
    { keywords: ['SEAT'], component: 'SEAT' },
    { keywords: ['DOOR', 'EXIT', 'OVERWING EXIT'], component: 'DOOR' },
    { keywords: ['TABLE'], component: 'TRAY_TABLE' },
  ];

  for (const { keywords, component } of components) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return component;
    }
  }

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
