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
 * Weight for each month = EOD count for that month.
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
 * Aircraft heatmap alert level — monthly average based (no sigma).
 * Only 'normal' and 'alert' levels. Alert when rate > 1.5× monthly fleet avg.
 */
export function getAlertLevel(
  rate: number,
  avgRate: number
): 'normal' | 'alert' {
  if (avgRate === 0) return 'normal';
  if (rate > avgRate * 1.5) return 'alert';
  return 'normal';
}

export function generateAlerts(
  findings: SAFARecord[],
  eodRecords: EODRecord[],
  sigmaSettings: SigmaSettings = { multiplier: 2 },
  minEODThreshold: number = 1
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Build total EOD per month
  const totalEODPerMonth: Record<string, number> = {};
  eodRecords.forEach(e => {
    const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
    totalEODPerMonth[month] = (totalEODPerMonth[month] || 0) + 1;
  });

  const findingMonths = Array.from(new Set(
    findings.map(f => format(startOfMonth(new Date(f.date)), 'yyyy-MM'))
  )).sort();

  // ── Aircraft Alerts ──
  const aircraftMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!aircraftMonthFindings[f.aircraft]) aircraftMonthFindings[f.aircraft] = {};
    aircraftMonthFindings[f.aircraft][month] = (aircraftMonthFindings[f.aircraft][month] || 0) + 1;
  });

  const aircraftMonthEOD: Record<string, Record<string, number>> = {};
  eodRecords.forEach(e => {
    const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
    if (!aircraftMonthEOD[e.aircraft]) aircraftMonthEOD[e.aircraft] = {};
    aircraftMonthEOD[e.aircraft][month] = (aircraftMonthEOD[e.aircraft][month] || 0) + 1;
  });

  const totalFindingsPerMonth: Record<string, number> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    totalFindingsPerMonth[month] = (totalFindingsPerMonth[month] || 0) + 1;
  });

  // Fleet-wide monthly rates + weights for aircraft alerts
  const fleetRates: number[] = [];
  const fleetWeights: number[] = [];
  findingMonths.forEach(month => {
    const tf = totalFindingsPerMonth[month] || 0;
    const te = totalEODPerMonth[month] || 0;
    if (te > 0) {
      fleetRates.push(tf / te);
      fleetWeights.push(te);
    }
  });
  const fleetStats = computeWeightedStats(fleetRates, fleetWeights);
  const fleetThreshold = fleetStats.weightedAvg + sigmaSettings.multiplier * fleetStats.weightedSigma;

  Object.keys(aircraftMonthFindings).forEach(ac => {
    Object.keys(aircraftMonthFindings[ac]).forEach(month => {
      const findingCount = aircraftMonthFindings[ac][month];
      const eodCount = aircraftMonthEOD[ac]?.[month] || 0;
      if (eodCount < minEODThreshold) return;
      const rate = findingCount / eodCount;
      const level = getAlertLevelSigma(rate, fleetStats.weightedAvg, fleetStats.weightedSigma, sigmaSettings);
      if (level !== 'normal') {
        alerts.push({
          type: 'aircraft',
          name: ac,
          month,
          rate,
          avgRate: fleetStats.weightedAvg,
          sigma: fleetStats.weightedSigma,
          threshold: fleetThreshold,
          findings: findingCount,
          eods: eodCount,
          level,
          ratio: fleetThreshold > 0 ? rate / fleetThreshold : 0,
        });
      }
    });
  });

  // ── Component Alerts ──
  const componentMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!componentMonthFindings[f.component]) componentMonthFindings[f.component] = {};
    componentMonthFindings[f.component][month] = (componentMonthFindings[f.component][month] || 0) + 1;
  });

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

  // ── ATA Alerts ──
  const ataMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    const ata2 = f.ata.substring(0, 2);
    if (!ataMonthFindings[ata2]) ataMonthFindings[ata2] = {};
    ataMonthFindings[ata2][month] = (ataMonthFindings[ata2][month] || 0) + 1;
  });

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
