import { CommitInfo } from ".";

export enum EScannerTypes {
  "FILE_SCANNER" = "FILE_SCANNER",
  "GIT_SCANNER" = "GIT_SCANNER",
}

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
  extras?: {
    version?: number;
    [key: string]: any;
  };
}

export interface UnifiedScanResult extends ScanResult {
  filePath: string;
  commitInfo?: CommitInfo;
  url?: string;
  isUrl?: boolean;
  mask?: boolean;
  scannerType: EScannerTypes;
}

export interface DetectorConfig {
  regex: string | Record<string, string>;
  keywords: string[];
  detectorType: string;
  group?: string[];
}
