import { EODRecord, EODMonthlyData, AlertItem, SAFARecord } from './types';
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

export function getAlertLevel(
  rate: number,
  avgRate: number
): 'normal' | 'watch' | 'alert' {
  if (avgRate === 0) return 'normal';
  if (rate <= avgRate) return 'normal';
  if (rate <= avgRate * 1.5) return 'watch';
  return 'alert';
}

export function generateAlerts(
  findings: SAFARecord[],
  eodRecords: EODRecord[],
  minEODThreshold: number = 1
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Build total EOD per month (shared by component & ATA)
  const totalEODPerMonth: Record<string, number> = {};
  eodRecords.forEach(e => {
    const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
    totalEODPerMonth[month] = (totalEODPerMonth[month] || 0) + 1;
  });

  // All months that appear in findings (defines the heatmap month range)
  const findingMonths = Array.from(new Set(
    findings.map(f => format(startOfMonth(new Date(f.date)), 'yyyy-MM'))
  )).sort();

  // ══════════════════════════════════════════════════════════════
  // ── Aircraft Alerts ──
  // Rate: aircraft findings / aircraft EODs per month
  //   (same as AircraftHeatmap rateData)
  // Avg baseline: fleet-wide monthly avg = totalFindings / totalEODs that month
  //   (same as AircraftHeatmap monthlyAvgRate)
  // ══════════════════════════════════════════════════════════════
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

  // Total findings per month (fleet-wide)
  const totalFindingsPerMonth: Record<string, number> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    totalFindingsPerMonth[month] = (totalFindingsPerMonth[month] || 0) + 1;
  });

  // Fleet-wide monthly average rate (matching AircraftHeatmap monthlyAvgRate)
  const monthlyFleetAvgRate: Record<string, number> = {};
  findingMonths.forEach(month => {
    const tf = totalFindingsPerMonth[month] || 0;
    const te = totalEODPerMonth[month] || 0;
    monthlyFleetAvgRate[month] = te > 0 ? tf / te : 0;
  });

  Object.keys(aircraftMonthFindings).forEach(ac => {
    Object.keys(aircraftMonthFindings[ac]).forEach(month => {
      const findingCount = aircraftMonthFindings[ac][month];
      const eodCount = aircraftMonthEOD[ac]?.[month] || 0;
      if (eodCount < minEODThreshold) return;
      const rate = findingCount / eodCount;
      const avgForMonth = monthlyFleetAvgRate[month] || 0;
      const level = getAlertLevel(rate, avgForMonth);
      if (level !== 'normal') {
        alerts.push({
          type: 'aircraft',
          name: ac,
          month,
          rate,
          avgRate: avgForMonth,
          findings: findingCount,
          eods: eodCount,
          level,
          ratio: avgForMonth > 0 ? rate / avgForMonth : 0,
        });
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // ── Component Alerts ──
  // Rate: component findings / total EODs that month
  //   (same as ComponentHeatmap rateData)
  // Avg baseline: per-component own average across ALL months where rate >= 0
  //   i.e. iterate all findingMonths, if EOD exists that month → rate = findings/eods
  //   (even if findings=0 for that component, rate=0 is included in avg)
  //   (same as ComponentHeatmap avgRatePerComponent)
  // ══════════════════════════════════════════════════════════════
  const componentMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!componentMonthFindings[f.component]) componentMonthFindings[f.component] = {};
    componentMonthFindings[f.component][month] = (componentMonthFindings[f.component][month] || 0) + 1;
  });

  // Per-component average rate matching ComponentHeatmap:
  // Iterate ALL findingMonths → for each month if eod > 0: rate = compFindings/eod (could be 0)
  // Average of all those rates (rate >= 0)
  const componentAvgRates: Record<string, number> = {};
  Object.keys(componentMonthFindings).forEach(comp => {
    const rates: number[] = [];
    findingMonths.forEach(month => {
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount > 0) {
        const compFindings = componentMonthFindings[comp]?.[month] || 0;
        rates.push(compFindings / eodCount);
      }
    });
    componentAvgRates[comp] = rates.length > 0
      ? rates.reduce((a, b) => a + b, 0) / rates.length
      : 0;
  });

  Object.keys(componentMonthFindings).forEach(comp => {
    Object.keys(componentMonthFindings[comp]).forEach(month => {
      const findingCount = componentMonthFindings[comp][month];
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount < minEODThreshold) return;
      const rate = findingCount / eodCount;
      const avgRate = componentAvgRates[comp] || 0;
      const level = getAlertLevel(rate, avgRate);
      if (level !== 'normal') {
        alerts.push({
          type: 'component',
          name: comp,
          month,
          rate,
          avgRate,
          findings: findingCount,
          eods: eodCount,
          level,
          ratio: avgRate > 0 ? rate / avgRate : 0,
        });
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  // ── ATA Alerts ──
  // Rate: ATA findings / total EODs that month
  //   (same as ATAHeatmap rateData)
  // Avg baseline: per-ATA own average across ALL months where rate >= 0
  //   i.e. iterate all findingMonths, if EOD exists that month → rate = ataFindings/eod
  //   (even if findings=0 for that ATA, rate=0 is included in avg)
  //   (same as ATAHeatmap avgRatePerATA)
  // ══════════════════════════════════════════════════════════════
  const ataMonthFindings: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    const ata2 = f.ata.substring(0, 2);
    if (!ataMonthFindings[ata2]) ataMonthFindings[ata2] = {};
    ataMonthFindings[ata2][month] = (ataMonthFindings[ata2][month] || 0) + 1;
  });

  // Per-ATA average rate matching ATAHeatmap:
  // Same logic as component — iterate all findingMonths, include rate=0 if EOD exists
  const ataAvgRates: Record<string, number> = {};
  Object.keys(ataMonthFindings).forEach(ata => {
    const rates: number[] = [];
    findingMonths.forEach(month => {
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount > 0) {
        const ataFindings = ataMonthFindings[ata]?.[month] || 0;
        rates.push(ataFindings / eodCount);
      }
    });
    ataAvgRates[ata] = rates.length > 0
      ? rates.reduce((a, b) => a + b, 0) / rates.length
      : 0;
  });

  Object.keys(ataMonthFindings).forEach(ata => {
    Object.keys(ataMonthFindings[ata]).forEach(month => {
      const findingCount = ataMonthFindings[ata][month];
      const eodCount = totalEODPerMonth[month] || 0;
      if (eodCount < minEODThreshold) return;
      const rate = findingCount / eodCount;
      const avgRate = ataAvgRates[ata] || 0;
      const level = getAlertLevel(rate, avgRate);
      if (level !== 'normal') {
        alerts.push({
          type: 'ata',
          name: ata,
          month,
          rate,
          avgRate,
          findings: findingCount,
          eods: eodCount,
          level,
          ratio: avgRate > 0 ? rate / avgRate : 0,
        });
      }
    });
  });

  alerts.sort((a, b) => {
    const levelOrder = { alert: 0, watch: 1, normal: 2 };
    if (levelOrder[a.level] !== levelOrder[b.level]) {
      return levelOrder[a.level] - levelOrder[b.level];
    }
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
