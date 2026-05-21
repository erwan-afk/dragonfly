export const specificationsData = [
  {
    title: 'Additional Features',
    items: [
      { key: 'dinghy', label: 'Dinghy' },
      { key: 'storage-cradle', label: 'Storage cradle' },
      { key: 'trailer', label: 'Trailer' }
    ]
  },
  {
    title: 'Comfort and Interior',
    items: [
      { key: 'air-conditioning', label: 'Air conditioning' },
      { key: 'cockpit-shower', label: 'Cockpit shower' },
      { key: 'freezer', label: 'Freezer' },
      { key: 'heating-system', label: 'Heating system' },
      { key: 'holding-tank', label: 'Holding tank' },
      { key: 'hot-water-system', label: 'Hot water system' },
      { key: 'marine-toilet', label: 'Marine toilet' },
      { key: 'refrigerator', label: 'Refrigerator' },
      { key: 'shower', label: 'Shower' },
      { key: 'watermaker', label: 'Watermaker' }
    ]
  },
  {
    title: 'Condition and History',
    items: [
      { key: 'full-service-history', label: 'Full service history' },
      { key: 'one-owner', label: 'One owner' },
      { key: 'professional-maintenance', label: 'Professional maintenance' },
      { key: 'recent-survey', label: 'Recent survey' }
    ]
  },
  {
    title: 'Hull and Structure',
    items: [
      { key: 'carbon-beams', label: 'Carbon beams' },
      { key: 'carbon-bowsprit', label: 'Carbon bowsprit' },
      { key: 'carbon-mast', label: 'Carbon mast' },
      { key: 'cockpit-tent', label: 'Cockpit tent' },
      { key: 'coppercoat-antifouling', label: 'Coppercoat antifouling' },
      { key: 'epoxy-construction', label: 'Epoxy construction' },
      { key: 'sprayhood', label: 'Sprayhood' }
    ]
  },
  {
    title: 'Navigation and Electronics',
    items: [
      { key: 'autopilot', label: 'Autopilot' },
      { key: 'chartplotter', label: 'Chartplotter' },
      { key: 'depth-sounder', label: 'Depth sounder' },
      { key: 'radar', label: 'Radar' },
      { key: 'vhf-radio', label: 'VHF radio' },
      { key: 'wind-instruments', label: 'Wind instruments' }
    ]
  },
  {
    title: 'Power and Propulsion',
    items: [
      { key: 'bow-thruster', label: 'Bow thruster' },
      { key: 'diesel-engine', label: 'Diesel engine' },
      { key: 'electric-motor', label: 'Electric motor' },
      { key: 'hydro-generator', label: 'Hydro generator' },
      { key: 'lithium-batteries', label: 'Lithium batteries' },
      { key: 'outboard-engine', label: 'Outboard engine' },
      { key: 'solar-panels', label: 'Solar panels' }
    ]
  },
  {
    title: 'Safety Equipment',
    items: [
      { key: 'bilge-pumps', label: 'Bilge pumps' },
      { key: 'epirb', label: 'EPIRB' },
      { key: 'fire-extinguishers', label: 'Fire extinguishers' },
      { key: 'life-raft', label: 'Life raft' }
    ]
  },
  {
    title: 'Sails and Rigging',
    items: [
      { key: 'electric-winches', label: 'Electric winches' },
      { key: 'furling-genoa', label: 'Furling genoa' },
      { key: 'gennaker-spinnaker', label: 'Gennaker/Spinnaker' },
      { key: 'kevlar-sails', label: 'Kevlar sails' },
      { key: 'self-tacking-jib', label: 'Self-tacking jib' }
    ]
  }
];

// Maps common variations / typos / English aliases to canonical catalog keys.
// Anything not in the catalog and not in this map is dropped during import.
const SPEC_SYNONYMS: Record<string, string> = {
  // Trailer
  'road-trailer': 'trailer',
  'trailor': 'trailer',
  'harbour-trailer': 'trailer',
  'harbeck-trailer': 'trailer',
  // Engine
  'engine': 'outboard-engine',
  'inboard-engine': 'diesel-engine',
  'saildrive': 'diesel-engine',
  // Refrigeration
  'fridge': 'refrigerator',
  // Batteries
  'battery': 'lithium-batteries',
  'batteries': 'lithium-batteries',
  // Autopilot
  'autohelm': 'autopilot',
  // Safety
  'liferaft': 'life-raft',
  // Heating
  'heater': 'heating-system',
  'eberspacher': 'heating-system',
  'eberspächer': 'heating-system',
  // Toilet
  'toilet': 'marine-toilet',
  // Owner history
  'second-owner': 'one-owner',
  // Navigation umbrellas → chartplotter (most representative)
  'navigation-equipment': 'chartplotter',
  'navigation-instruments': 'chartplotter',
  // Sails
  'spinnaker': 'gennaker-spinnaker',
  'gennaker': 'gennaker-spinnaker',
};

const ALL_VALID_KEYS: Set<string> = new Set(
  specificationsData.flatMap((section) => section.items.map((item) => item.key))
);

const ALL_LABELS: Map<string, string> = new Map(
  specificationsData.flatMap((section) =>
    section.items.map((item) => [item.label.toLowerCase(), item.key])
  )
);

/**
 * Normalize a spec string (from CSV/import) to a canonical catalog key.
 * Returns null if the spec cannot be resolved — caller should drop it.
 */
export function normalizeSpecKey(raw: string): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (!lower) return null;

  if (ALL_VALID_KEYS.has(lower)) return lower;

  const byLabel = ALL_LABELS.get(lower);
  if (byLabel) return byLabel;

  const synonym = SPEC_SYNONYMS[lower];
  if (synonym && ALL_VALID_KEYS.has(synonym)) return synonym;

  return null;
}

/**
 * Normalize a list of spec strings, deduplicate, and drop unknown entries.
 */
export function normalizeSpecList(raws: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of raws) {
    const key = normalizeSpecKey(raw);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

const KEY_TO_LABEL: Map<string, string> = new Map(
  specificationsData.flatMap((section) =>
    section.items.map((item) => [item.key, item.label])
  )
);

const KEY_TO_SECTION: Map<string, string> = new Map(
  specificationsData.flatMap((section) =>
    section.items.map((item) => [item.key, section.title])
  )
);

export function getSpecLabel(key: string): string {
  return KEY_TO_LABEL.get(key) ?? key;
}

export interface SpecGroup {
  title: string;
  items: { key: string; label: string }[];
}

/**
 * Group a boat's spec keys by their catalog section, preserving section order.
 * Unknown keys are bucketed under "Other".
 */
export function groupSpecsBySection(keys: string[]): SpecGroup[] {
  const buckets = new Map<string, { key: string; label: string }[]>();
  for (const key of keys) {
    const section = KEY_TO_SECTION.get(key) ?? 'Other';
    const label = KEY_TO_LABEL.get(key) ?? key;
    if (!buckets.has(section)) buckets.set(section, []);
    buckets.get(section)!.push({ key, label });
  }
  const ordered: SpecGroup[] = [];
  for (const section of specificationsData) {
    const items = buckets.get(section.title);
    if (items && items.length) ordered.push({ title: section.title, items });
  }
  const other = buckets.get('Other');
  if (other && other.length) ordered.push({ title: 'Other', items: other });
  return ordered;
}
