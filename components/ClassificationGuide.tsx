'use client';

const PROBLEM_TYPES = [
  { type: 'DENT',         color: '#fb923c', dot: 'bg-orange-400',  keywords: 'DENT, DENTED  (tam kelime — IDENT eşleşmez)' },
  { type: 'PAINT_DAMAGE', color: '#f97316', dot: 'bg-orange-500',  keywords: 'PAINT DAMAGE, PAINT DMG, PEELED OFF PAINT' },
  { type: 'EXPIRED',      color: '#ec4899', dot: 'bg-pink-400',    keywords: 'EXPIRE, EXPIRED, EXPIRE DATE' },
  { type: 'MISSING',      color: '#ef4444', dot: 'bg-red-400',     keywords: 'MISSING, MISS, NOT INSTALLED' },
  { type: 'DAMAGED',      color: '#f59e0b', dot: 'bg-amber-400',   keywords: 'DAMAGED, DAMAGE, CRACK, BROKEN, TORN, WORN, UNREADABLE, FADED' },
  { type: 'LOOSE',        color: '#eab308', dot: 'bg-yellow-500',  keywords: 'LOOSE, NOT FIXED, NOT ATTACHED, NOT SECURED, DISPLACED' },
  { type: 'INOPERATIVE',  color: '#8b5cf6', dot: 'bg-violet-400',  keywords: 'INOP, U/S, NOT WORKING, FAULTY, DEFECTIVE, DOES NOT MOVE, WEAK' },
  { type: 'CLEANLINESS',  color: '#06b6d4', dot: 'bg-cyan-400',    keywords: 'DIRTY, NEEDS CLEANING  → component AIRCRAFT_DIRTY\'a zorla atanır' },
  { type: 'ADJUSTMENT',   color: '#10b981', dot: 'bg-emerald-400', keywords: 'ADJUSTMENT, OUT OF ADJUSTMENT, WRONG POSITION / DIRECTION' },
  { type: 'OTHER',        color: '#6b7280', dot: 'bg-gray-400',    keywords: 'Hiçbir kurala uymayan bulgular' },
];

const COMPONENT_GROUPS = [
  {
    group: 'Koltuk',
    accent: 'border-blue-200 bg-blue-50',
    header: 'text-blue-700',
    items: [
      { name: 'SEAT_PAX',     keys: 'PAX, PASSENGER, PASS, PASSANGER, genel SEAT' },
      { name: 'SEAT_ATT',     keys: 'ATTENDANT, ATT, CABIN ATTENDANT, ATTEND' },
      { name: 'SEAT_COCKPIT', keys: 'CPT, CAPT, CAPTAIN, F/O, OBSERVER, FLIGHT DECK' },
      { name: 'SEAT_BELT',    keys: 'SEAT BELT, SAFETY BELT, SAFETY HARNESS' },
      { name: 'TRAY_TABLE',   keys: 'FOOD TRAY, TRAY TABLE, BABY TABLE, TABLE' },
    ],
  },
  {
    group: 'Kabin İç',
    accent: 'border-indigo-200 bg-indigo-50',
    header: 'text-indigo-700',
    items: [
      { name: 'OVERHEAD_BIN',    keys: 'OVERHEAD BIN, STOWAGE BIN, STOWAGE BOX, BIN STOP; OVERHEAD+DOOR birlikte' },
      { name: 'CURTAIN',         keys: 'CURTAIN  (GALLEY\'den önce gelir)' },
      { name: 'GALLEY',          keys: 'GALLEY' },
      { name: 'LAVATORY',        keys: 'LAVATORY, LAV A-E, SOAP DISPENSER, WASH BASIN, TOILET' },
      { name: 'CARPET',          keys: 'CARPET, FLOOR MAT' },
      { name: 'MIRROR',          keys: 'MIRROR' },
      { name: 'DADO_PANEL',      keys: 'DADO, GRILL, GRILLE, GRIL' },
      { name: 'SUNSHADE_COCKPIT',keys: 'SUNSHADE + (CPT/F.O/COCKPIT/CAPTAIN…), SUNVISOR, SUNVIZOR' },
      { name: 'SUNSHADE_PAX',    keys: 'Diğer tüm SUNSHADE, WINDOW SHADE, SUN SHADE' },
      { name: 'WINDOW',          keys: 'WINDOW, WINDOWS' },
    ],
  },
  {
    group: 'Panel',
    accent: 'border-slate-200 bg-slate-50',
    header: 'text-slate-700',
    items: [
      { name: 'FLOOR_PANEL',    keys: 'FLOOR PANEL' },
      { name: 'CEILING_PANEL',  keys: 'CEILING PANEL' },
      { name: 'DOOR_PANEL',     keys: 'DOOR PANEL' },
      { name: 'SIDE_PANEL',     keys: 'SIDE PANEL, WALL PANEL' },
      { name: 'TRIM_PANEL',     keys: 'TRIM PANEL' },
      { name: 'PANEL',          keys: 'PANEL, TRIM, GLARE SHIELD, GLARESHIELD' },
    ],
  },
  {
    group: 'Kapı & Kilit',
    accent: 'border-gray-200 bg-gray-50',
    header: 'text-gray-700',
    items: [
      { name: 'DOOR',  keys: 'DOOR, EXIT, OVERWING EXIT  (OVERHEAD+DOOR → OVERHEAD_BIN)' },
      { name: 'LATCH', keys: 'DOOR LATCH, COWL LATCH, PANEL LATCH, NET LATCH, LATCH SPRING…' },
      { name: 'HINGE', keys: 'HINGE' },
    ],
  },
  {
    group: 'Aydınlatma',
    accent: 'border-yellow-200 bg-yellow-50',
    header: 'text-yellow-700',
    items: [
      { name: 'LIGHT', keys: 'LAMP, LAMPS  (her şeyden önce); READING/EMERGENCY/EXIT/NAV/STROBE LIGHT; BULB; PHOTOLUMINESCENT' },
    ],
  },
  {
    group: 'Güvenlik & Emniyet',
    accent: 'border-red-200 bg-red-50',
    header: 'text-red-700',
    items: [
      { name: 'LIFE_VEST',    keys: 'LIFE VEST, LIFEVEST' },
      { name: 'OXYGEN',       keys: 'OXYGEN, OXY BOTTLE' },
      { name: 'FIRST_AID_KIT',keys: 'FIRST AID KIT, FAK' },
      { name: 'FLASHLIGHT',   keys: 'FLASHLIGHT, ETL, TORCH' },
      { name: 'PLACARD',      keys: 'PLACARD, PLACRDS, STICKER, STENCIL  (SEAT ve SEAT_BELT\'den önce gelir)' },
    ],
  },
  {
    group: 'Gövde & Yapı',
    accent: 'border-stone-200 bg-stone-50',
    header: 'text-stone-700',
    items: [
      { name: 'FUSELAGE_SKIN',         keys: 'FUS SKIN, FUSELAGE, FUSALAGE, FUSULAGE, FUSILAGE, BODY FAIRING, BUTT JOINT SEALANT' },
      { name: 'HORIZONTAL_STABILIZER', keys: 'HORIZONTAL STAB, HORIZONTAL STABILIZER' },
      { name: 'ANTISKATING_FOIL',      keys: 'ANTISKATING FOIL, OUTFLOW VALVE FOIL' },
      { name: 'SCUFF_PLATE',           keys: 'SCUFF PLATE' },
      { name: 'VAPOR_BARRIER',         keys: 'VAPOR BARRIER' },
      { name: 'DRAIN_MAST',            keys: 'DRAIN MAST' },
      { name: 'BLADE_SEAL',            keys: 'BLADE SEAL' },
      { name: 'BONDING',               keys: 'BONDING, BONDING WIRE, JUMPER' },
    ],
  },
  {
    group: 'Kanat & Motor',
    accent: 'border-orange-200 bg-orange-50',
    header: 'text-orange-700',
    items: [
      { name: 'ENGINE',      keys: '#1/#2 ENGINE, ENGINE COWL, FAN BLADE, ENGINE PYLON, ENG' },
      { name: 'FLAP',        keys: 'FLAP' },
      { name: 'SLAT',        keys: 'SLAT' },
      { name: 'KRUGER_FLAP', keys: 'KRUGER, KRUEGER, KRUGGER, KRUEGGER' },
      { name: 'ANTENNA',     keys: 'ANTENNA' },
    ],
  },
  {
    group: 'İniş Takımı',
    accent: 'border-zinc-200 bg-zinc-50',
    header: 'text-zinc-700',
    items: [
      { name: 'LANDING_GEAR',       keys: 'LANDING GEAR, TIRE, SHOCK STRUT, WHEEL WELL, BRAKE UNIT, MLG, NLG, L/G, LG PIN, SAFETY PIN' },
      { name: 'LG_OIL_CHARGING_VALVE', keys: 'OIL CHARGING, CHARGING VALVE, CHARGINGVELVES  (LANDING_GEAR\'den önce gelir)' },
    ],
  },
  {
    group: 'Kargo',
    accent: 'border-teal-200 bg-teal-50',
    header: 'text-teal-700',
    items: [
      { name: 'CARGO_NETS',   keys: 'CARGO + NET (yan yana olmak zorunda değil)' },
      { name: 'CARGO_TAPES',  keys: 'CARGO + TAPE (yan yana olmak zorunda değil)' },
      { name: 'CARGO_LANYARD',keys: 'LANYARD RING, LANYARDS, LANYARD ASSY; RINGS+CARGO' },
    ],
  },
  {
    group: 'Yer Desteği & Diğer',
    accent: 'border-green-200 bg-green-50',
    header: 'text-green-700',
    items: [
      { name: 'GROUND_SUPPORT_BAG', keys: 'GROUND SUPPORT BAG, PINS BAG, PIN BAG  (LANDING_GEAR\'den önce gelir)' },
      { name: 'WATER_SYSTEM',       keys: 'WATER SERVICE, POTABLE WATER' },
      { name: 'SECURITY_BOX',       keys: 'SECURITY BOX' },
      { name: 'AIRCRAFT_DIRTY',     keys: 'Problem Type = CLEANLINESS ise tüm bileşenler buraya zorla atanır' },
      { name: 'OTHER',              keys: 'Hiçbir kurala uymayan bulgular' },
    ],
  },
];

export function ClassificationGuide() {
  return (
    <div className="space-y-8">
      {/* Problem Types */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Problem Tipleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PROBLEM_TYPES.map(({ type, dot, keywords }) => (
            <div key={type} className="flex gap-2.5 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800">{type}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{keywords}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Component Types */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Component Tipleri</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COMPONENT_GROUPS.map(({ group, accent, header, items }) => (
            <div key={group} className={`border rounded-xl overflow-hidden ${accent}`}>
              <div className={`px-3 py-2 border-b ${accent}`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${header}`}>{group}</span>
              </div>
              <div className="divide-y divide-white/60">
                {items.map(({ name, keys }) => (
                  <div key={name} className="flex gap-2.5 px-3 py-2 bg-white/70">
                    <span className="text-xs font-semibold text-gray-800 w-40 shrink-0">{name}</span>
                    <span className="text-xs text-gray-500 leading-relaxed">{keys}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
