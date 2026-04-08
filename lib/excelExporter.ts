import * as XLSX from 'xlsx';
import { SAFARecord, EODRecord, SigmaSettings } from './types';
import { format, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { generateAlerts, getOverallMonthlyRate, computeWeightedStats, getAlertLevelSigma } from './eodProcessor';

interface ExportOptions {
  findings: SAFARecord[];
  eodRecords?: EODRecord[];
  sigmaSettings?: SigmaSettings;
}

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

export function exportFullReport({ findings, eodRecords, sigmaSettings = DEFAULT_SIGMA }: ExportOptions) {
  const workbook = XLSX.utils.book_new();
  const hasEOD = eodRecords && eodRecords.length > 0;
  const dateStamp = new Date().toISOString().split('T')[0];

  // 1. Time Series
  addTrendSheet(workbook, findings, eodRecords, sigmaSettings);

  // 2. Component Heatmap
  addComponentHeatmapSheet(workbook, findings, eodRecords, sigmaSettings);

  // 3. Aircraft Heatmap
  addAircraftHeatmapSheet(workbook, findings, eodRecords);

  // 4. ATA Heatmap
  addATAHeatmapSheet(workbook, findings, eodRecords, sigmaSettings);

  // 5. Alert Panel
  if (hasEOD) {
    addAlertSheet(workbook, findings, eodRecords!, sigmaSettings);
  }

  // 6. Raw Data
  addRawDataSheet(workbook, findings);

  XLSX.writeFile(workbook, `safa-full-report-${dateStamp}.xlsx`);
}

function formatCompName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ════════════════════════════════════════════
// Sheet 1: Time Series / Trend
// ════════════════════════════════════════════
function addTrendSheet(workbook: XLSX.WorkBook, findings: SAFARecord[], eodRecords?: EODRecord[], sigmaSettings: SigmaSettings = DEFAULT_SIGMA) {
  const hasEOD = eodRecords && eodRecords.length > 0;

  const monthlyFindings: Record<string, number> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    monthlyFindings[month] = (monthlyFindings[month] || 0) + 1;
  });

  const monthlyEODs: Record<string, number> = {};
  if (hasEOD) {
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      monthlyEODs[month] = (monthlyEODs[month] || 0) + 1;
    });
  }

  const allMonths = Array.from(new Set([
    ...Object.keys(monthlyFindings),
    ...(hasEOD ? Object.keys(monthlyEODs) : []),
  ])).sort();

  const header = hasEOD
    ? ['Month', 'Findings', 'EODs', 'Rate (F/EOD)']
    : ['Month', 'Findings'];

  const rows: any[][] = allMonths.map(month => {
    const f = monthlyFindings[month] || 0;
    const e = monthlyEODs[month] || 0;
    const monthLabel = format(new Date(month + '-01'), 'MMM yyyy', { locale: enUS });
    if (hasEOD) {
      return [monthLabel, f, e, e > 0 ? parseFloat((f / e).toFixed(4)) : 'N/A'];
    }
    return [monthLabel, f];
  });

  // Summary
  const totalFindings = allMonths.reduce((s, m) => s + (monthlyFindings[m] || 0), 0);
  const avgPerMonth = allMonths.length > 0 ? parseFloat((totalFindings / allMonths.length).toFixed(1)) : 0;
  const findingValues = allMonths.map(m => monthlyFindings[m] || 0).filter(v => v > 0);

  rows.push([]);
  rows.push(['Summary']);
  rows.push(['Total Findings', totalFindings]);
  rows.push(['Months', allMonths.length]);
  rows.push(['Avg / Month', avgPerMonth]);
  rows.push(['Highest', findingValues.length > 0 ? Math.max(...findingValues) : 0]);
  rows.push(['Lowest', findingValues.length > 0 ? Math.min(...findingValues) : 0]);

  if (hasEOD) {
    const rateData = getOverallMonthlyRate(findings, eodRecords!);
    const withData = rateData.filter(m => m.eods > 0);
    const rates = withData.map(m => m.rate);
    const weights = withData.map(m => m.eods);
    const stats = computeWeightedStats(rates, weights);
    const alertThresh = stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma;

    rows.push(['Weighted Avg Rate', parseFloat(stats.weightedAvg.toFixed(4))]);
    rows.push(['Weighted Sigma', parseFloat(stats.weightedSigma.toFixed(4))]);
    rows.push([`Alert Threshold (Avg+${sigmaSettings.multiplier}σ)`, parseFloat(alertThresh.toFixed(4))]);
    rows.push(['Total EODs', Object.values(monthlyEODs).reduce((a, b) => a + b, 0)]);
    rows.push(['Sigma Settings', `Alert: ${sigmaSettings.multiplier}σ`]);
  }

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [{ wch: 30 }, { wch: 14 }, ...(hasEOD ? [{ wch: 10 }, { wch: 14 }] : [])];
  XLSX.utils.book_append_sheet(workbook, ws, 'Time Series');
}

// ════════════════════════════════════════════
// Sheet 2: Component Heatmap (Count + Rate)
// ════════════════════════════════════════════
function addComponentHeatmapSheet(workbook: XLSX.WorkBook, findings: SAFARecord[], eodRecords?: EODRecord[], sigmaSettings: SigmaSettings = DEFAULT_SIGMA) {
  const hasEOD = eodRecords && eodRecords.length > 0;

  const months = Array.from(new Set(
    findings.map(f => format(startOfMonth(new Date(f.date)), 'yyyy-MM'))
  )).sort();

  const eodPerMonth: Record<string, number> = {};
  if (hasEOD) {
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      eodPerMonth[month] = (eodPerMonth[month] || 0) + 1;
    });
  }

  const compMonthData: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!compMonthData[f.component]) compMonthData[f.component] = {};
    compMonthData[f.component][month] = (compMonthData[f.component][month] || 0) + 1;
  });

  const sortedComps = Object.entries(compMonthData)
    .map(([comp, data]) => ({ comp, total: Object.values(data).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .map(c => c.comp);

  // Weighted stats per component
  const compWeightedStats: Record<string, { weightedAvg: number; weightedSigma: number }> = {};
  if (hasEOD) {
    sortedComps.forEach(comp => {
      const rates: number[] = [];
      const weights: number[] = [];
      months.forEach(month => {
        const eods = eodPerMonth[month] || 0;
        if (eods > 0) {
          rates.push((compMonthData[comp]?.[month] || 0) / eods);
          weights.push(eods);
        }
      });
      compWeightedStats[comp] = computeWeightedStats(rates, weights);
    });
  }

  const monthLabels = months.map(m => format(new Date(m + '-01'), 'MMM yy', { locale: enUS }));

  // Count sheet
  const countHeader = ['Component', ...monthLabels, 'Total'];
  const countRows = sortedComps.map(comp => {
    const row: any[] = [formatCompName(comp)];
    let total = 0;
    months.forEach(month => {
      const v = compMonthData[comp]?.[month] || 0;
      row.push(v || '');
      total += v;
    });
    row.push(total);
    return row;
  });

  const wsCount = XLSX.utils.aoa_to_sheet([countHeader, ...countRows]);
  wsCount['!cols'] = [{ wch: 24 }, ...months.map(() => ({ wch: 10 })), { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, wsCount, 'Component (Count)');

  // Rate sheet
  if (hasEOD) {
    const rateHeader = ['Component', ...monthLabels, 'Wt. Avg', 'Wt. σ', 'Alert Threshold', 'Alert Level'];

    // EOD totals row
    const eodRow: any[] = ['EOD Total'];
    months.forEach(month => { eodRow.push(eodPerMonth[month] || 0); });
    eodRow.push('', '', '', '');

    const rateRows = sortedComps.map(comp => {
      const row: any[] = [formatCompName(comp)];
      let maxLevel: 'normal' | 'alert' = 'normal';
      const stats = compWeightedStats[comp] || { weightedAvg: 0, weightedSigma: 0 };
      months.forEach(month => {
        const fc = compMonthData[comp]?.[month] || 0;
        const eods = eodPerMonth[month] || 0;
        if (eods > 0) {
          const rate = fc / eods;
          row.push(parseFloat(rate.toFixed(4)));
          const level = getAlertLevelSigma(rate, stats.weightedAvg, stats.weightedSigma, sigmaSettings);
          if (level === 'alert') maxLevel = 'alert';
        } else {
          row.push(fc > 0 ? `${fc}*` : '');
        }
      });
      row.push(parseFloat(stats.weightedAvg.toFixed(4)));
      row.push(parseFloat(stats.weightedSigma.toFixed(4)));
      row.push(parseFloat((stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma).toFixed(4)));
      row.push(maxLevel === 'alert' ? '🔴 ALERT' : '🟢 Normal');
      return row;
    });

    const wsRate = XLSX.utils.aoa_to_sheet([rateHeader, ...rateRows, [], eodRow]);
    wsRate['!cols'] = [{ wch: 24 }, ...months.map(() => ({ wch: 10 })), { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, wsRate, 'Component (Rate)');
  }
}

// ════════════════════════════════════════════
// Sheet 3: Aircraft Heatmap (Count + Rate)
// Aircraft stays the same: fleet avg per month baseline
// ════════════════════════════════════════════
function addAircraftHeatmapSheet(workbook: XLSX.WorkBook, findings: SAFARecord[], eodRecords?: EODRecord[]) {
  const hasEOD = eodRecords && eodRecords.length > 0;

  const months = Array.from(new Set(
    findings.map(f => format(startOfMonth(new Date(f.date)), 'yyyy-MM'))
  )).sort();

  const acMonthData: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    if (!acMonthData[f.aircraft]) acMonthData[f.aircraft] = {};
    acMonthData[f.aircraft][month] = (acMonthData[f.aircraft][month] || 0) + 1;
  });

  const acMonthEOD: Record<string, Record<string, number>> = {};
  const totalEODPerMonth: Record<string, number> = {};
  const totalFindingsPerMonth: Record<string, number> = {};
  if (hasEOD) {
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      if (!acMonthEOD[e.aircraft]) acMonthEOD[e.aircraft] = {};
      acMonthEOD[e.aircraft][month] = (acMonthEOD[e.aircraft][month] || 0) + 1;
      totalEODPerMonth[month] = (totalEODPerMonth[month] || 0) + 1;
    });
    findings.forEach(f => {
      const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
      totalFindingsPerMonth[month] = (totalFindingsPerMonth[month] || 0) + 1;
    });
  }

  // Fleet monthly avg (matching AircraftHeatmap — stays the same)
  const monthlyFleetAvg: Record<string, number> = {};
  if (hasEOD) {
    months.forEach(month => {
      const tf = totalFindingsPerMonth[month] || 0;
      const te = totalEODPerMonth[month] || 0;
      monthlyFleetAvg[month] = te > 0 ? tf / te : 0;
    });
  }

  const sortedAC = Object.entries(acMonthData)
    .map(([ac, data]) => ({ ac, total: Object.values(data).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .map(c => c.ac);

  const monthLabels = months.map(m => format(new Date(m + '-01'), 'MMM yy', { locale: enUS }));

  // Count sheet
  const countHeader = ['Aircraft', ...monthLabels, 'Total'];
  const countRows = sortedAC.map(ac => {
    const row: any[] = [ac];
    let total = 0;
    months.forEach(month => {
      const v = acMonthData[ac]?.[month] || 0;
      row.push(v || '');
      total += v;
    });
    row.push(total);
    return row;
  });

  const wsCount = XLSX.utils.aoa_to_sheet([countHeader, ...countRows]);
  wsCount['!cols'] = [{ wch: 14 }, ...months.map(() => ({ wch: 10 })), { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, wsCount, 'Aircraft (Count)');

  // Rate sheet — fleet avg per month baseline (unchanged)
  if (hasEOD) {
    const rateHeader = ['Aircraft', ...monthLabels, 'Max Alert'];

    // Fleet avg row
    const fleetAvgRow: any[] = ['Fleet Avg'];
    months.forEach(month => {
      fleetAvgRow.push(parseFloat((monthlyFleetAvg[month] || 0).toFixed(4)));
    });
    fleetAvgRow.push('');

    const rateRows = sortedAC.map(ac => {
      const row: any[] = [ac];
      let maxLevel: 'normal' | 'alert' = 'normal';
      months.forEach(month => {
        const fc = acMonthData[ac]?.[month] || 0;
        const eodCount = acMonthEOD[ac]?.[month] || 0;
        if (eodCount > 0) {
          const rate = fc / eodCount;
          row.push(parseFloat(rate.toFixed(4)));
          const avgForMonth = monthlyFleetAvg[month] || 0;
          // Aircraft uses legacy getAlertLevel (fleet avg per month)
          if (avgForMonth > 0) {
            if (rate > avgForMonth * 1.5) maxLevel = 'alert';
          }
        } else {
          row.push(fc > 0 ? `${fc}*` : '');
        }
      });
      row.push(maxLevel === 'alert' ? '🔴 ALERT' : '🟢 Normal');
      return row;
    });

    const wsRate = XLSX.utils.aoa_to_sheet([rateHeader, fleetAvgRow, ...rateRows]);
    wsRate['!cols'] = [{ wch: 14 }, ...months.map(() => ({ wch: 10 })), { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, wsRate, 'Aircraft (Rate)');
  }
}

// ════════════════════════════════════════════
// Sheet 4: ATA Heatmap (Count + Rate)
// ════════════════════════════════════════════
function addATAHeatmapSheet(workbook: XLSX.WorkBook, findings: SAFARecord[], eodRecords?: EODRecord[], sigmaSettings: SigmaSettings = DEFAULT_SIGMA) {
  const hasEOD = eodRecords && eodRecords.length > 0;

  const months = Array.from(new Set(
    findings.map(f => format(startOfMonth(new Date(f.date)), 'yyyy-MM'))
  )).sort();

  const eodPerMonth: Record<string, number> = {};
  if (hasEOD) {
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      eodPerMonth[month] = (eodPerMonth[month] || 0) + 1;
    });
  }

  const ataMonthData: Record<string, Record<string, number>> = {};
  findings.forEach(f => {
    const month = format(startOfMonth(new Date(f.date)), 'yyyy-MM');
    const ata2 = f.ata.substring(0, 2);
    if (!ataMonthData[ata2]) ataMonthData[ata2] = {};
    ataMonthData[ata2][month] = (ataMonthData[ata2][month] || 0) + 1;
  });

  const ataNames: Record<string, string> = {
    '05': 'Time Limits', '06': 'Dimensions', '07': 'Lifting & Shoring',
    '08': 'Leveling & Weighing', '09': 'Towing & Taxiing', '10': 'Parking & Mooring',
    '11': 'Placards', '12': 'Servicing', '20': 'Standard Practices',
    '21': 'Air Conditioning', '22': 'Auto Flight', '23': 'Communications',
    '24': 'Electrical Power', '25': 'Equipment/Furnishings', '26': 'Fire Protection',
    '27': 'Flight Controls', '28': 'Fuel', '29': 'Hydraulic Power',
    '30': 'Ice & Rain Protection', '31': 'Indicating/Recording', '32': 'Landing Gear',
    '33': 'Lights', '34': 'Navigation', '35': 'Oxygen', '36': 'Pneumatic',
    '38': 'Water/Waste', '45': 'Central Maint System', '49': 'Airborne APU',
    '51': 'Standard Practices', '52': 'Doors', '53': 'Fuselage',
    '54': 'Nacelles/Pylons', '55': 'Stabilizers', '56': 'Windows', '57': 'Wings',
    '71': 'Power Plant', '72': 'Engine', '73': 'Engine Fuel & Control',
    '74': 'Ignition', '75': 'Air', '76': 'Engine Controls',
    '77': 'Engine Indicating', '78': 'Exhaust', '79': 'Oil', '80': 'Starting',
  };

  const sortedATA = Object.entries(ataMonthData)
    .map(([ata, data]) => ({ ata, total: Object.values(data).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .map(c => c.ata);

  // Weighted stats per ATA
  const ataWeightedStats: Record<string, { weightedAvg: number; weightedSigma: number }> = {};
  if (hasEOD) {
    sortedATA.forEach(ata => {
      const rates: number[] = [];
      const weights: number[] = [];
      months.forEach(month => {
        const eods = eodPerMonth[month] || 0;
        if (eods > 0) {
          rates.push((ataMonthData[ata]?.[month] || 0) / eods);
          weights.push(eods);
        }
      });
      ataWeightedStats[ata] = computeWeightedStats(rates, weights);
    });
  }

  const monthLabels = months.map(m => format(new Date(m + '-01'), 'MMM yy', { locale: enUS }));

  // Count sheet
  const countHeader = ['ATA', 'Name', ...monthLabels, 'Total'];
  const countRows = sortedATA.map(ata => {
    const row: any[] = [ata, ataNames[ata] || ''];
    let total = 0;
    months.forEach(month => {
      const v = ataMonthData[ata]?.[month] || 0;
      row.push(v || '');
      total += v;
    });
    row.push(total);
    return row;
  });

  const wsCount = XLSX.utils.aoa_to_sheet([countHeader, ...countRows]);
  wsCount['!cols'] = [{ wch: 6 }, { wch: 22 }, ...months.map(() => ({ wch: 10 })), { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, wsCount, 'ATA (Count)');

  // Rate sheet
  if (hasEOD) {
    const rateHeader = ['ATA', 'Name', ...monthLabels, 'Wt. Avg', 'Wt. σ', 'Alert Threshold', 'Alert Level'];

    // EOD totals row
    const eodRow: any[] = ['', 'EOD Total'];
    months.forEach(month => { eodRow.push(eodPerMonth[month] || 0); });
    eodRow.push('', '', '', '');

    const rateRows = sortedATA.map(ata => {
      const row: any[] = [ata, ataNames[ata] || ''];
      let maxLevel: 'normal' | 'alert' = 'normal';
      const stats = ataWeightedStats[ata] || { weightedAvg: 0, weightedSigma: 0 };
      months.forEach(month => {
        const fc = ataMonthData[ata]?.[month] || 0;
        const eods = eodPerMonth[month] || 0;
        if (eods > 0) {
          const rate = fc / eods;
          row.push(parseFloat(rate.toFixed(4)));
          const level = getAlertLevelSigma(rate, stats.weightedAvg, stats.weightedSigma, sigmaSettings);
          if (level === 'alert') maxLevel = 'alert';
        } else {
          row.push(fc > 0 ? `${fc}*` : '');
        }
      });
      row.push(parseFloat(stats.weightedAvg.toFixed(4)));
      row.push(parseFloat(stats.weightedSigma.toFixed(4)));
      row.push(parseFloat((stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma).toFixed(4)));
      row.push(maxLevel === 'alert' ? '🔴 ALERT' : '🟢 Normal');
      return row;
    });

    const wsRate = XLSX.utils.aoa_to_sheet([rateHeader, ...rateRows, [], eodRow]);
    wsRate['!cols'] = [{ wch: 6 }, { wch: 22 }, ...months.map(() => ({ wch: 10 })), { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, wsRate, 'ATA (Rate)');
  }
}

// ════════════════════════════════════════════
// Sheet 5: Alert Panel
// ════════════════════════════════════════════
function addAlertSheet(workbook: XLSX.WorkBook, findings: SAFARecord[], eodRecords: EODRecord[], sigmaSettings: SigmaSettings = DEFAULT_SIGMA) {
  const alerts = generateAlerts(findings, eodRecords, sigmaSettings);

  const header = ['Level', 'Type', 'Name', 'Month', 'Findings', 'EODs', 'Rate', 'Wt. Avg', 'Wt. σ', 'Alert Thresh', 'Ratio'];
  const rows: any[][] = alerts.map(a => [
    '🔴 ALERT',
    a.type.charAt(0).toUpperCase() + a.type.slice(1),
    a.name.replace(/_/g, ' '),
    format(new Date(a.month + '-01'), 'MMM yyyy', { locale: enUS }),
    a.findings,
    a.eods,
    parseFloat(a.rate.toFixed(4)),
    parseFloat(a.avgRate.toFixed(4)),
    parseFloat(a.sigma.toFixed(4)),
    parseFloat(a.threshold.toFixed(4)),
    a.ratio.toFixed(2) + '×',
  ]);

  // Summary
  const alertCount = alerts.length;
  const acAlerts = alerts.filter(a => a.type === 'aircraft');
  const compAlerts = alerts.filter(a => a.type === 'component');
  const ataAlerts = alerts.filter(a => a.type === 'ata');

  rows.push([]);
  rows.push(['Summary']);
  rows.push(['Sigma Settings', `Alert: ${sigmaSettings.multiplier}σ`]);
  rows.push(['Total Alerts', alertCount]);
  rows.push(['Aircraft', `${acAlerts.length} alert`]);
  rows.push(['Component', `${compAlerts.length} alert`]);
  rows.push(['ATA', `${ataAlerts.length} alert`]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 12 },
    { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(workbook, ws, 'Alerts');
}

// ════════════════════════════════════════════
// Sheet 6: Raw Data
// ════════════════════════════════════════════
function addRawDataSheet(workbook: XLSX.WorkBook, findings: SAFARecord[]) {
  const header = ['W/O Number', 'Date', 'ATA', 'Aircraft', 'Problem Type', 'Component', 'Description'];
  const rows = findings.map(r => [
    r.woNumber,
    new Date(r.date).toLocaleDateString('en-US'),
    r.ata,
    r.aircraft,
    r.problemType,
    r.component.replace(/_/g, ' '),
    r.cleanDescription,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 16 }, { wch: 24 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(workbook, ws, 'Raw Data');
}
