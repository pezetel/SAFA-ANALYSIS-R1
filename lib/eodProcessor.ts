import { EODRecord, EODMonthlyData, AlertItem, SAFARecord, SigmaSettings } from './types';
import { format, startOfMonth } from 'date-fns';

const EOD_COLUMN_ALIASES: Record<string, string[]> = {
  event: ['event', 'eod', 'eod number', 'eod no'],
  eventStatus: ['event status', 'status', 'eventstatus'],
  revision: ['revision', 'rev', 'revision no'],
  effectivity: ['effectivity', 'eff', 'effectivity code'],
  aircraft: ['a/c', 'ac', 'aircraft', 'registration', 'tail'],
  rotable: ['rotable', 'rot'],
  workorder: ['workorder', 'work order', 'wo', 'w/o', 'wo number', 'w/o number'],
  workpackage: ['workpackage', 'work package', 'wp'],
  perfDate: ['perf. date', 'perf date', 'performance date', 'date', 'performed date', 'perfdate'],
};

function normalizeAircraftReg(value: string): string {
  if (!value) return 'UNKNOWN';
  let str = String(value).trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(String(value).trim().toUpperCase())) {
    str = 'TC-' + String(value).trim().toUpperCase();
  }
  if (/^TC-[A-Z]{3}$/.test(str)) {
    return str;
  }
  if (/^TC[A-Z]{3}$/.test(str)) {
    return str.slice(0, 2) + '-' + str.slice(2);
  }
  return str || 'UNKNOWN';
}

function parseEODDate(dateStr: any): Date | null {
  if (!dateStr) return null;

  const str = String(dateStr).trim();

  const dotMonthMatch = str.match(/^(\d{1,2})\.([A-Za-z]{3})\.?(\d{4})$/);
  if (dotMonthMatch) {
    const [, day, monthStr, year] = dotMonthMatch;
    const date = new Date(`${day} ${monthStr} ${year}`);
    if (!isNaN(date.getTime())) return date;
  }

  const ddmmyyyyDot = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyDot) {
    const [, day, month, year] = ddmmyyyyDot;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const ddmmyyyySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyySlash) {
    const [, day, month, year] = ddmmyyyySlash;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  return null;
}

export function processEODData(rawData: any[]): EODRecord[] {
  if (!rawData || rawData.length === 0) {
    throw new Error('EOD Excel file is empty or invalid');
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

  Object.entries(EOD_COLUMN_ALIASES).forEach(([targetKey, aliases]) => {
    for (const alias of aliases) {
      if (firstRow.hasOwnProperty(alias)) {
        columnMap[targetKey] = alias;
        break;
      }
    }
  });

  if (!columnMap.perfDate) {
    throw new Error('Performance Date column not found in EOD data');
  }
  if (!columnMap.aircraft) {
    throw new Error('Aircraft (A/C) column not found in EOD data');
  }

  const records: EODRecord[] = [];

  normalizedData.forEach((row, index) => {
    try {
      const dateStr = row[columnMap.perfDate];
      const aircraftRaw = row[columnMap.aircraft || ''] || '';
      const date = parseEODDate(dateStr);

      if (!date) return;

      const aircraft = normalizeAircraftReg(aircraftRaw);

      records.push({
        event: row[columnMap.event || ''] || '',
        eventStatus: row[columnMap.eventStatus || ''] || '',
        revision: row[columnMap.revision || ''] || '',
        effectivity: row[columnMap.effectivity || ''] || '',
        aircraft,
        rotable: row[columnMap.rotable || ''] || '',
        workorder: row[columnMap.workorder || ''] || '',
        workpackage: row[columnMap.workpackage || ''] || '',
        perfDate: date,
      });
    } catch (error) {
      console.warn(`Error processing EOD row ${index + 1}:`, error);
    }
  });

  if (records.length === 0) {
    throw new Error('No processable EOD data found');
  }

  return records;
}

export function getEODMonthlyData(eodRecords: EODRecord[]): EODMonthlyData[] {
  const monthMap: Record<string, EODMonthlyData> = {};

  eodRecords.forEach(record => {
    const monthKey = format(startOfMonth(new Date(record.perfDate)), 'yyyy-MM');
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { month: monthKey, totalEODs: 0, byAircraft: {} };
    }
    monthMap[monthKey].totalEODs++;
    monthMap[monthKey].byAircraft[record.aircraft] = 
      (monthMap[monthKey].byAircraft[record.aircraft] || 0) + 1;
  });

  return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
}

export function calculateFindingRate(
  findingsCount: number,
  eodCount: number
): number {
  if (eodCount === 0) return 0;
  return findingsCount / eodCount;
}

/**
 * Computes weighted average and weighted standard deviation.
 * Weight for each data point = EOD count.
 * weightedAvg = Sum(rate_i * w_i) / Sum(w_i)
 * weightedSigma = sqrt( Sum(w_i * (rate_i - weightedAvg)^2) / Sum(w_i) )
 */
export function computeWeightedStats(
  rates: number[],
  weights: number[]
): { weightedAvg: number; weightedSigma: number } {
  if (rates.length === 0 || weights.length === 0) {
    return { weightedAvg: 0, weightedSigma: 0 };
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return { weightedAvg: 0, weightedSigma: 0 };

  const weightedAvg = rates.reduce((sum, r, i) => sum + r * weights[i], 0) / totalWeight;
  const variance = rates.reduce((sum, r, i) => sum + weights[i] * Math.pow(r - weightedAvg, 2), 0) / totalWeight;
  const weightedSigma = Math.sqrt(variance);

  return { weightedAvg, weightedSigma };
}

/**
 * Sigma-based alert level for Component and ATA heatmaps.
 * Alert when rate > weightedAvg + multiplier * weightedSigma.
 */
export function getAlertLevelSigma(
  rate: number,
  weightedAvg: number,
  weightedSigma: number,
  sigmaSettings: SigmaSettings
): 'normal' | 'alert' {
  if (weightedAvg === 0 && weightedSigma === 0) return 'normal';
  const alertThreshold = weightedAvg + sigmaSettings.multiplier * weightedSigma;
  if (rate > alertThreshold) return 'alert';
  return 'normal';
}

/**
 * Aircraft heatmap alert level — NO sigma.
 * Uses simple 1.5x monthly fleet average as threshold.
 * Each aircraft's rate for a given month is compared to that month's fleet avg.
 * Alert when rate > monthlyFleetAvg * 1.5.
 */
export function getAlertLevel(
  rate: number,
  avgRate: number
): 'normal' | 'alert' {
  if (avgRate === 0) return 'normal';
  if (rate > avgRate * 1.5) return 'alert';
  return 'normal';
}

/**
 * Generate alerts by collecting alert cells directly from heatmap logic.
 *
 * - Aircraft: rate > monthlyFleetAvg x 1.5 (NO sigma, matches AircraftHeatmap)
 *   Each month has its own fleet avg = totalFindings/totalEODs for that month.
 *   Each aircraft rate = acFindings/acEODs for that month.
 *
 * - Component: rate > per-component weightedAvg + N x sigma (matches ComponentHeatmap)
 *   rate = compFindings / totalEODs for that month.
 *   Each component has its own weighted avg & sigma across all months.
 *
 * - ATA: rate > per-ATA weightedAvg + N x sigma (matches ATAHeatmap)
 *   rate = ataFindings / totalEODs for that month.
 *   Each ATA chapter has its own weighted avg & sigma across all months.
 */
export function generateAlerts(
  findings: SAFARecord[],
  eodRecords: EODRecord[],
  sigmaSettings: SigmaSettings = { multiplier: 2 },
  minEODThreshold: number = 1
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Build total EOD per month (fleet-wide)
  const totalEODPerMonth: Record<string, number> = {};
  eodRecords.forEach(e => {
    const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
    totalEODPerMonth[month] = (totalEODPerMonth[month] || 0) + 1;
  });

  // Build total findings per month (fleet-wide)
  const totalFindingsPerMonth: Record<string, number> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    totalFindingsPerMonth[month] = (totalFindingsPerMonth[month] || 0) + 1;
  });

  const findingMonths = Array.from(new Set(
    findings.map(f => format(startOfMonth(new Date(f.date)), 'yyyy-MM'))
  )).sort();

  // ── Aircraft Alerts (matches AircraftHeatmap — NO sigma, 1.5x monthly fleet avg) ──
  const aircraftMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!aircraftMonthFindings[f.aircraft]) aircraftMonthFindings[f.aircraft] = {};
    aircraftMonthFindings[f.aircraft][month] = (aircraftMonthFindings[f.aircraft][month] || 0) + 1;
  });

  // EOD per aircraft per month
  const aircraftMonthEOD: Record<string, Record<string, number>> = {};
  eodRecords.forEach(e => {
    const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
    if (!aircraftMonthEOD[e.aircraft]) aircraftMonthEOD[e.aircraft] = {};
    aircraftMonthEOD[e.aircraft][month] = (aircraftMonthEOD[e.aircraft][month] || 0) + 1;
  });

  // Monthly fleet avg rate = totalFindings / totalEODs for that month
  const monthlyFleetAvg: Record<string, number> = {};
  findingMonths.forEach(month => {
    const tf = totalFindingsPerMonth[month] || 0;
    const te = totalEODPerMonth[month] || 0;
    monthlyFleetAvg[month] = te > 0 ? tf / te : 0;
  });

  // For each aircraft x month: rate = acFindings/acEODs, alert if rate > monthFleetAvg x 1.5
  const allAircraft = Array.from(new Set([
    ...Object.keys(aircraftMonthFindings),
    ...Object.keys(aircraftMonthEOD),
  ]));

  allAircraft.forEach(ac => {
    const acMonths = Object.keys(aircraftMonthFindings[ac] || {});
    acMonths.forEach(month => {
      const findingCount = aircraftMonthFindings[ac]?.[month] || 0;
      const eodCount = aircraftMonthEOD[ac]?.[month] || 0;
      if (eodCount < minEODThreshold) return;

      const rate = findingCount / eodCount;
      const fleetAvg = monthlyFleetAvg[month] || 0;
      const threshold = fleetAvg * 1.5;

      if (fleetAvg > 0 && rate > threshold) {
        alerts.push({
          type: 'aircraft',
          name: ac,
          month,
          rate,
          avgRate: fleetAvg,
          sigma: 0, // Aircraft doesn't use sigma
          threshold,
          findings: findingCount,
          eods: eodCount,
          level: 'alert',
          ratio: threshold > 0 ? rate / threshold : 0,
        });
      }
    });
  });

  // ── Component Alerts (matches ComponentHeatmap — per-component weighted avg + Nσ) ──
  const componentMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!componentMonthFindings[f.component]) componentMonthFindings[f.component] = {};
    componentMonthFindings[f.component][month] = (componentMonthFindings[f.component][month] || 0) + 1;
  });

  // Per-component weighted stats: rate = compFindings/totalEODs per month, weighted by totalEODs
  const componentWeightedStats: Record<string, { weightedAvg: number; weightedSigma: number }> = {};
  Object.keys(componentMonthFindings).forEach(comp => {
    const rates: number[] = [];
    const weights: number[] = [];
    findingMonths.forEach(month => {
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount > 0) {
        const compFindings = componentMonthFindings[comp]?.[month] || 0;
        rates.push(compFindings / eodCount);
        weights.push(eodCount);
      }
    });
    componentWeightedStats[comp] = computeWeightedStats(rates, weights);
  });

  Object.keys(componentMonthFindings).forEach(comp => {
    Object.keys(componentMonthFindings[comp]).forEach(month => {
      const findingCount = componentMonthFindings[comp][month];
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount < minEODThreshold) return;
      const rate = findingCount / eodCount;
      const stats = componentWeightedStats[comp] || { weightedAvg: 0, weightedSigma: 0 };
      const threshold = stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma;
      const level = getAlertLevelSigma(rate, stats.weightedAvg, stats.weightedSigma, sigmaSettings);
      if (level !== 'normal') {
        alerts.push({
          type: 'component',
          name: comp,
          month,
          rate,
          avgRate: stats.weightedAvg,
          sigma: stats.weightedSigma,
          threshold,
          findings: findingCount,
          eods: eodCount,
          level,
          ratio: threshold > 0 ? rate / threshold : 0,
        });
      }
    });
  });

  // ── ATA Alerts (matches ATAHeatmap — per-ATA weighted avg + Nσ) ──
  const ataMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    const ata2 = f.ata.substring(0, 2);
    if (!ataMonthFindings[ata2]) ataMonthFindings[ata2] = {};
    ataMonthFindings[ata2][month] = (ataMonthFindings[ata2][month] || 0) + 1;
  });

  // Per-ATA weighted stats: rate = ataFindings/totalEODs per month, weighted by totalEODs
  const ataWeightedStats: Record<string, { weightedAvg: number; weightedSigma: number }> = {};
  Object.keys(ataMonthFindings).forEach(ata => {
    const rates: number[] = [];
    const weights: number[] = [];
    findingMonths.forEach(month => {
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount > 0) {
        const ataFindings = ataMonthFindings[ata]?.[month] || 0;
        rates.push(ataFindings / eodCount);
        weights.push(eodCount);
      }
    });
    ataWeightedStats[ata] = computeWeightedStats(rates, weights);
  });

  Object.keys(ataMonthFindings).forEach(ata => {
    Object.keys(ataMonthFindings[ata]).forEach(month => {
      const findingCount = ataMonthFindings[ata][month];
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount < minEODThreshold) return;
      const rate = findingCount / eodCount;
      const stats = ataWeightedStats[ata] || { weightedAvg: 0, weightedSigma: 0 };
      const threshold = stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma;
      const level = getAlertLevelSigma(rate, stats.weightedAvg, stats.weightedSigma, sigmaSettings);
      if (level !== 'normal') {
        alerts.push({
          type: 'ata',
          name: ata,
          month,
          rate,
          avgRate: stats.weightedAvg,
          sigma: stats.weightedSigma,
          threshold,
          findings: findingCount,
          eods: eodCount,
          level,
          ratio: threshold > 0 ? rate / threshold : 0,
        });
      }
    });
  });

  alerts.sort((a, b) => {
    return b.ratio - a.ratio;
  });

  return alerts;
}

export function getOverallMonthlyRate(
  findings: SAFARecord[],
  eodRecords: EODRecord[]
): { month: string; findings: number; eods: number; rate: number }[] {
  const findingsPerMonth: Record<string, number> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    findingsPerMonth[month] = (findingsPerMonth[month] || 0) + 1;
  });

  const eodsPerMonth: Record<string, number> = {};
  eodRecords.forEach(e => {
    const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
    eodsPerMonth[month] = (eodsPerMonth[month] || 0) + 1;
  });

  const allMonths = Array.from(new Set([
    ...Object.keys(findingsPerMonth),
    ...Object.keys(eodsPerMonth),
  ])).sort();

  return allMonths.map(month => {
    const f = findingsPerMonth[month] || 0;
    const e = eodsPerMonth[month] || 0;
    return {
      month,
      findings: f,
      eods: e,
      rate: e > 0 ? f / e : 0,
    };
  });
}
