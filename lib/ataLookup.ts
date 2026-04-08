import ataDescriptions from './ataDescriptions.json';

const ataMap: Record<string, string> = ataDescriptions;

/**
 * Get the description for a 6-digit ATA code (e.g. "25-22-00")
 * Falls back to 4-digit (XX-XX) then 2-digit (XX) parent descriptions.
 * Returns empty string if nothing found.
 */
export function getATADescription(ataCode: string): string {
  if (!ataCode || ataCode === 'UNKNOWN') return '';

  const normalized = ataCode.trim();

  // Try exact match first (e.g. 25-22-00)
  if (ataMap[normalized]) {
    return ataMap[normalized];
  }

  // Try with -00 suffix (e.g. 25-22 -> 25-22-00)
  const parts = normalized.split('-');
  if (parts.length === 2) {
    const withSuffix = `${parts[0]}-${parts[1]}-00`;
    if (ataMap[withSuffix]) {
      return ataMap[withSuffix];
    }
  }

  // Try parent 4-digit (e.g. 25-22-00 -> 25-22-00 already tried, try 25-00-00)
  if (parts.length === 3) {
    // Try XX-YY-00
    const fourDigitParent = `${parts[0]}-${parts[1]}-00`;
    if (ataMap[fourDigitParent]) {
      return ataMap[fourDigitParent];
    }
    // Try XX-00-00
    const twoDigitParent = `${parts[0]}-00-00`;
    if (ataMap[twoDigitParent]) {
      return ataMap[twoDigitParent];
    }
  }

  return '';
}

/**
 * Format ATA code with its description for display.
 * e.g. "25-22-00" -> "25-22-00 – CABIN EQUIPMENT"
 */
export function formatATAWithDescription(ataCode: string): string {
  const desc = getATADescription(ataCode);
  if (desc) {
    return `${ataCode} – ${desc}`;
  }
  return ataCode;
}
