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
      const component = extractComponent(cleanDescription, problemType, ata);
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
  // Strip HTML tags (e.g. <BR>, <br/>, <p> from web-based source systems)
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
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

  // Normalize curly/smart quotes to straight apostrophe so keyword matching works
  cleaned = cleaned.replace(/[‘’′`]/g, "'");
  cleaned = cleaned.replace(/[“”]/g, '"');

  cleaned = cleaned.replace(/FOND /g, 'FOUND ');
  cleaned = cleaned.replace(/NOR WORKING/g, 'NOT WORKING');
  cleaned = cleaned.replace(/MISISING/g, 'MISSING');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

function extractProblemType(description: string): string {
  const text = description.toUpperCase();

  // DENT must be a standalone word — "IDENT", "EVIDENT", "INCIDENT" must not match.
  if (/\bDENTED?\b/.test(text)) return 'DENT';

  const problemTypes = [
    { keywords: ['PAINT DAMAGE', 'PAINT DAMAGED', 'PAINTING DAMAGE', 'PAINT DAMAGES', 'PAINT DMG', 'PEELED OF PAINT', 'PEELED OFF PAINT', 'PAINTDAMAGE'], type: 'PAINT_DAMAGE' },
    { keywords: ['EXPIRE DATE', 'EXPIRED', 'EXPIRE'], type: 'EXPIRED' },
    { keywords: ['NOT INSTALLED'], type: 'MISSING' },
    { keywords: ['MISSING', 'MISS'], type: 'MISSING' },
    { keywords: ['UNREADABLE', 'NOT READABLE'], type: 'DAMAGED' },
    { keywords: ['DAMAGED', 'DAMAGE', 'CRACK', 'BROKEN', 'TORN', 'WORN', 'BAD CONDITION', 'NEED TO BE REPLACE', 'NEEDS REPLACEMENT', 'NEED REPLACEMENT', 'FRIED', 'FADED'], type: 'DAMAGED' },
    { keywords: ['LOOSE', 'NOT FIXED', 'NOT ATTACHED', 'NOT SECURED', 'DISPLACED'], type: 'LOOSE' },
    { keywords: ['INOP', 'NOT WORKING', 'NOT ILLUMINATE', 'NOT FUNCTIONING', 'FAULTY', 'DOESNT MOVE', 'DOES NOT MOVE', 'DOESNT WORK', "DOESN'T WORK", 'DOESN T WORK', 'DONT LOCK', "DON'T LOCK", 'DON T LOCK', "DON'T WORK", 'DON T WORK', 'DONT WORK', 'PARTIALLY WORKING', 'NOT OPERATE', 'NOT OPERATING', 'DEFECTIVE', 'WEAK', 'NOT WORK', 'U/S'], type: 'INOPERATIVE' },
    { keywords: ['DIRTY', 'NEEDS TO BE CLEAN', 'NEEDS CLEANING', 'NEED TO BE CLEAN'], type: 'CLEANLINESS' },
    { keywords: ['NOT CORRECT', 'WRONG SIDE', 'WRONG POSITION', 'WRONG DIRECTION'], type: 'ADJUSTMENT' },
    { keywords: ['ADJUSTMENT', 'OUT OF ADJUSTMENT', 'NEED TO BE ADJUST', 'NEEDS TO BE ADJUST', 'NEED TO ADJUSTED', 'NEED TO BEADJUST', 'NEEDS TO BEADJUST'], type: 'ADJUSTMENT' },
  ];

  for (const { keywords, type } of problemTypes) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return type;
    }
  }

  // Check for standalone "US" as a word (not part of another word like "FUSELAGE", "FOCUS" etc.)
  // This catches cases where people write "US" instead of "U/S" → maps to INOPERATIVE
  if (/\bUS\b/.test(text)) {
    return 'INOPERATIVE';
  }

  return 'OTHER';
}

// Returns the most specific SEAT sub-type based on who the seat belongs to.
// Called whenever a SEAT-family match is detected.
function refineSeat(text: string): string {
  // Cockpit crew seats
  if (
    text.includes('F/O') ||
    text.includes('FIRST OBSERVER') ||
    text.includes('SECOND OBSERVER') ||
    /\b(CPT|CAPT|CAPTAIN|CAPTAN|OBSERVER|FLIGHT DECK)\b/.test(text)
  ) {
    return 'SEAT_COCKPIT';
  }
  // Cabin attendant seats
  if (
    text.includes('CABIN ATTENDANT') ||
    /\b(ATTENDANT|ATTENDENT|ATTEND)\b/.test(text) ||
    /\bATT\b/.test(text)
  ) {
    return 'SEAT_ATT';
  }
  // Passenger seat (explicit markers or generic default)
  return 'SEAT_PAX';
}

function extractComponent(description: string, problemType?: string, ata?: string): string {
  const text = description.toUpperCase();

  // ─────────────────────────────────────────────────────────────────────────────
  // CLEANLINESS override — any cleanliness-typed finding is AIRCRAFT_DIRTY,
  // regardless of which physical component the description mentions.
  // ─────────────────────────────────────────────────────────────────────────────
  if (problemType === 'CLEANLINESS') {
    return 'AIRCRAFT_DIRTY';
  }

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
    'PHOTOLUMINESCENT',
  ];

  if (lightKeywords.some(keyword => text.includes(keyword))) {
    return 'LIGHT';
  }

  // Any mention of LAMP/LAMPS dominates everything else (incl. SEAT BELT).
  // e.g. "FASTEN SEAT BELT LAMP" → LIGHT, not SEAT_BELT.
  if (/\bLAMPS?\b/.test(text)) {
    return 'LIGHT';
  }

  if (/\bLIGHT\b/.test(text) && /\b(INOP|U\/S|MISSING|BROKEN|DAMAGED|NOT WORKING|FAULTY|DEFECTIVE|FOUND|REPLACE)\b/.test(text)) {
    return 'LIGHT';
  }
  if (/\bBULB\b/.test(text) && /\b(INOP|U\/S|MISSING|BROKEN|DAMAGED|NOT WORKING|FAULTY|DEFECTIVE|FOUND|REPLACE)\b/.test(text)) {
    return 'LIGHT';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LATCH must also be checked EARLY so that descriptions about a latch
  // problem are not swallowed by LAVATORY, ENGINE, CARGO_NETS, SEAT, DOOR,
  // OVERHEAD_BIN, etc.
  // ─────────────────────────────────────────────────────────────────────────────
  const latchKeywords = [
    'LATCH SPRING', 'LATCH SPRINGS',
    'COWL LATCH', 'COWL LATCHES',
    'DOOR LATCH', 'DOOR LATCHE', 'DOOR LATCHES',
    'PANEL LATCH', 'PANEL LATCHE', 'PANEL LATCHES',
    'NET LATCH', 'NET LATCHE', 'NET LATCHES',
    'LATCH ASSY', 'LATCH MECHANISM',
    'LATCH FOUND', 'LATCH IS', 'LATCH ARE',
    'LATCHES FOUND', 'LATCHE FOUND',
    'LATCHES NOT', 'LATCH NOT',
  ];

  if (latchKeywords.some(keyword => text.includes(keyword))) {
    return 'LATCH';
  }

  if (/\bLATCH(?:ES|E)?\b/.test(text) && /\b(INOP|U\/S|MISSING|BROKEN|DAMAGED|NOT WORKING|FAULTY|DEFECTIVE|FOUND|REPLACE|BAD CONDITION|SPRING|NOT FLASH|FOUNDDAMAGED|FOUNDBROKEN)\b/.test(text)) {
    return 'LATCH';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGO compound detection — both words appearing anywhere in the text
  // (not necessarily adjacent) routes the finding correctly.
  // ─────────────────────────────────────────────────────────────────────────────
  const hasCargo = text.includes('CARGO');
  if (hasCargo && /\bTAPES?\b/.test(text)) {
    return 'CARGO_TAPES';
  }
  if (hasCargo && /\bNETS?\b/.test(text)) {
    return 'CARGO_NETS';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUND_SUPPORT_BAG — must beat LANDING_GEAR (PIN BAG / SAFETY PIN overlap).
  // ─────────────────────────────────────────────────────────────────────────────
  const gsbKeywords = [
    'GROUND SUPPORT BAG',
    'GROUND SOPPORT EQUIPMENT BAG',
    'GROUND SUPPORT EQUIPMENT BAG',
    'PINS BAG',
    'PIN BAG',
  ];
  if (gsbKeywords.some(keyword => text.includes(keyword))) {
    return 'GROUND_SUPPORT_BAG';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OVERHEAD + DOOR mentioned together → OVERHEAD_BIN (not DOOR).
  // ─────────────────────────────────────────────────────────────────────────────
  if (/\bOVERHEAD\b/.test(text) && /\bDOOR\b/.test(text)) {
    return 'OVERHEAD_BIN';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUNSHADE — split into cockpit vs. PAX.  Run before WINDOW so that
  // "WINDOW SHADE" still routes to the SUNSHADE family.
  // ─────────────────────────────────────────────────────────────────────────────
  const isSunshade = /SUNSHADE|SUNSHEAD|SUN SHADE|WINDOW SHADE|WINDOWSHADE|WINDOW SHADES/.test(text);
  const sunvisor = /\bSUN ?VI[SZ]OR\b/.test(text);
  const cockpitMarkers = /\b(COCKPIT|F\/O|FO|CAPTAIN|CAPTAN|CPT|KAPTAN)\b/.test(text) || /\bF\.O\.?\b/.test(text);
  if (sunvisor) {
    return 'SUNSHADE_COCKPIT';
  }
  if (isSunshade && cockpitMarkers) {
    return 'SUNSHADE_COCKPIT';
  }
  if (isSunshade) {
    return 'SUNSHADE_PAX';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DADO_PANEL — grill / grille / gril / dado anywhere in the text.
  // ─────────────────────────────────────────────────────────────────────────────
  if (/\b(DADO|GRILLE|GRILL|GRIL)\b/.test(text)) {
    return 'DADO_PANEL';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CURTAIN beats GALLEY — a curtain finding inside a galley area is still a
  // curtain finding.
  // ─────────────────────────────────────────────────────────────────────────────
  if (text.includes('CURTAIN')) {
    return 'CURTAIN';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLACARD beats SEAT, SEAT_BELT, and all lower-priority components.
  // e.g. "FASTEN SEAT BELT PLACARD DAMAGED" → PLACARD, not SEAT_BELT.
  // ─────────────────────────────────────────────────────────────────────────────
  if (/\bPLACARDS?\b/.test(text) || text.includes('PLACRDS') || text.includes('STICKER') || text.includes('STENCIL')) {
    return 'PLACARD';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SEAT-family early routes — ARM REST / ARMREST / ARM CAP / ARMCAP / RECLINE.
  // ─────────────────────────────────────────────────────────────────────────────
  if (/\bARM ?RESTS?\b/.test(text) || /\bARM ?CAPS?\b/.test(text)) {
    return refineSeat(text);
  }
  if (/RECLINE/.test(text)) {
    return refineSeat(text);
  }

  // BAGGAGE BAR moved out of OVERHEAD_BIN into SEAT_PAX.
  if (text.includes('BAGGAGE BAR')) {
    return 'SEAT_PAX';
  }

  // GLARE SHIELD / GLARESHIELD → PANEL.
  if (/GLARE ?SHIELD/.test(text)) {
    return 'PANEL';
  }

  // WINDOW (after SUNSHADE so window-shade findings stay in the sunshade family).
  if (/\bWINDOWS?\b/.test(text)) {
    return 'WINDOW';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SEAT sub-type detection — catches all SEAT mentions not involving a belt.
  // SEAT_BELT / SAFETY BELT / SAFETY HARNESS fall through to the array below.
  // ─────────────────────────────────────────────────────────────────────────────
  if (/\bSEAT\b/.test(text) && !/(SEAT BELT|SAFETY BELT|SAFETY HARNESS)/.test(text)) {
    return refineSeat(text);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATA 25 FAIRING → SEAT sub-type (seat fairing/cover).
  // BODY FAIRING in other ATA chapters stays in FUSELAGE_SKIN below.
  // ─────────────────────────────────────────────────────────────────────────────
  if (text.includes('FAIRING') && ata && /^25/.test(ata)) {
    return refineSeat(text);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Remaining components in priority order.
  // ─────────────────────────────────────────────────────────────────────────────
  const components = [
    { keywords: ['ANTISKATING FOIL', 'ANTISKATINGFOIL', 'ANTISTATINGFOIL', 'OUTFLOW VALVE FOIL', 'OUTFLOW VALVE ANTISTATING'], component: 'ANTISKATING_FOIL' },
    { keywords: ['OIL SERVICING CHARGING', 'OIL SERVICING CHARGER', 'OIL CHARGING VALVE', 'OIL CHARHING VALVE', 'OIL CHARGINGVALVE', 'OIL CHARHINGVALUE', 'OIL CHARGING', 'OIL CHARGIN', 'OILCHARGING', 'CHARGING VALVE', 'CHARGINGVALVE', 'CHARGING VELVES', 'CHARGINGVELVES'], component: 'LG_OIL_CHARGING_VALVE' },
    { keywords: ['FUS SKIN', 'FUSELAGE SKIN', 'BUTT JOINT SEALANT', 'BODY FAIRING', 'BODYFAIRING', 'FUSELAGE', 'FUSALAGE', 'FUSULAGE', 'FUSILAGE'], component: 'FUSELAGE_SKIN' },
    { keywords: ['SCUFF PLATE', 'SCUFF PLATE FILLER'], component: 'SCUFF_PLATE' },
    { keywords: ['SECURITY BOX'], component: 'SECURITY_BOX' },
    { keywords: ['BLADE SEAL', 'BLADE SEALS'], component: 'BLADE_SEAL' },
    { keywords: ['DRAIN MAST'], component: 'DRAIN_MAST' },
    { keywords: ['VAPOR BARRIER'], component: 'VAPOR_BARRIER' },
    { keywords: ['JUMPER', 'BONDING WIRE', 'BONDING'], component: 'BONDING' },
    { keywords: ['LANYARD RING', 'LANYARDS RING', "LANYARD'S RING", 'LANYARDS RINGS', 'LANYARD RINGS', 'LANYARD ASSY', 'LINE YARD', 'LANYARD'], component: 'CARGO_LANYARD' },
    { keywords: ['HORIZONTAL STAB', 'HORIZONTAL STABILIZER', 'HORIZONTAL STABILISER'], component: 'HORIZONTAL_STABILIZER' },
    { keywords: ['FIRST AID KIT', 'FIRST AIT KIT', 'FAK'], component: 'FIRST_AID_KIT' },
    { keywords: ['FLASHLIGHT', 'FLASHLIGH', 'FLISHLIGHT', 'ETL', 'TORCH'], component: 'FLASHLIGHT' },
    { keywords: ['OVERHEAD BIN', 'STOWAGE BIN', 'STOWAGE BOX', 'OVERHEAD STOWAGE', 'BIN STOPPER', 'DOOR STOPPER', 'STOPPER', 'BIN STOP', 'BIN STOPS'], component: 'OVERHEAD_BIN' },
    { keywords: ['FOOD TRAY', 'TRAY TABLE', 'BABY TABLE'], component: 'TRAY_TABLE' },
    { keywords: ['SEAT BELT', 'SAFETY HARNESS', 'SAFETY BELT'], component: 'SEAT_BELT' },
    { keywords: ['LIFE VEST', 'LIFEVEST'], component: 'LIFE_VEST' },
    { keywords: ['PLACARD', 'PLACRDS', 'STICKER', 'STENCIL', 'LABEL'], component: 'PLACARD' },
    { keywords: ['LAVATORY', 'LAV A', 'LAV B', 'LAV C', 'LAV D', 'LAV E', 'SOAP DISPENSER', 'SOAP DISPENCER', 'WASH BASIN', 'TOILET', 'TOILET SHROUD'], component: 'LAVATORY' },
    { keywords: ['GALLEY'], component: 'GALLEY' },
    { keywords: ['OXYGEN', 'OXY BOTTLE'], component: 'OXYGEN' },
    { keywords: ['MIRROR'], component: 'MIRROR' },
    { keywords: ['CARPET', 'FLOOR MAT'], component: 'CARPET' },
    { keywords: ['ANTENNA'], component: 'ANTENNA' },
    { keywords: ['KRUGER FLAP', 'KRUGER', 'KRUEGER', 'KRUGGER', 'KRUEGGER'], component: 'KRUGER_FLAP' },
    { keywords: ['SLAT'], component: 'SLAT' },
    { keywords: ['FLAP'], component: 'FLAP' },
    { keywords: ['#1 ENGINE', '#2 ENGINE', '#1 ENG', '#2 ENG', 'ENGINE COWL', 'FAN BLADE', 'ENGINE PYLON'], component: 'ENGINE' },
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
    { keywords: ['DOOR', 'EXIT', 'OVERWING EXIT'], component: 'DOOR' },
    { keywords: ['TABLE'], component: 'TRAY_TABLE' },
  ];

  for (const { keywords, component } of components) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return component;
    }
  }

  // ENGINE — word-boundary check to avoid false positives from substrings
  if (/\bENGINE\b/.test(text) || /\bENG\b/.test(text)) {
    return 'ENGINE';
  }

  if (/\bRINGS?\b/.test(text) && text.includes('CARGO')) {
    return 'CARGO_LANYARD';
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
