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
