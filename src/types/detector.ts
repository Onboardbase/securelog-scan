export interface Detector {
  detectorType: string;
  keywords: string[];
  scan: (
    verify: boolean | undefined,
    data: string
  ) => Promise<ScanResult | null>;
}

export interface ScanResult {
  detectorType: string;
  rawValue?: string;
  verified: boolean;
  position?: number;
  extras?: Record<string, any>;
}

export interface DetectorConfig {
  regex: string | Record<string, string>;
  keywords: string[];
  detectorType: string;
  group?: string[];
}
