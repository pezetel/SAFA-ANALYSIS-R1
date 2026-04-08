export interface SAFARecord {
  woNumber: string;
  date: Date;
  ata: string;
  aircraft: string;
  paragraph: string;
  originalDescription: string;
  cleanDescription: string;
  problemType: string;
  component: string;
  severity: string;
}

export interface EODRecord {
  event: string;
  eventStatus: string;
  revision: string;
  effectivity: string;
  aircraft: string;
  rotable: string;
  workorder: string;
  workpackage: string;
  perfDate: Date;
}

export interface AnalysisResult {
  records: SAFARecord[];
  statistics: {
    totalRecords: number;
    uniqueAircraft: number;
    uniqueATA: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  aircraftCounts: Record<string, number>;
  ataCounts: Record<string, number>;
  problemTypeCounts: Record<string, number>;
  componentCounts: Record<string, number>;
  timeSeriesData: Record<string, SAFARecord[]>;
  topProblems: Array<{ component: string; count: number }>;
  topAircraft: Array<{ aircraft: string; count: number }>;
}

export interface FilterOptions {
  dateRange?: [Date, Date];
  aircraft?: string[];
  ata?: string[];
  problemType?: string[];
  component?: string[];
}

export interface EODMonthlyData {
  month: string;
  totalEODs: number;
  byAircraft: Record<string, number>;
}

export interface AlertItem {
  type: 'aircraft' | 'component' | 'ata';
  name: string;
  month: string;
  rate: number;
  avgRate: number;
  sigma: number;
  threshold: number;
  findings: number;
  eods: number;
  level: 'normal' | 'alert';
  ratio: number;
}

export interface SigmaSettings {
  multiplier: number;
}
