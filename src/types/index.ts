import { AhoCorasickCore } from "../ahocorasick";
import { DetectorConfig } from "./detector";

export interface ScanOptions {
  dir?: string;
  exclude?: string;
  commits?: string;
  config?: string;
  url?: string;
  changed?: boolean;
  verify?: boolean;
  mask?: boolean;
  rawValue?: string;
  file?: string;
  updateFile?: boolean;
}

export interface Config {
  exclude?: {
    paths?: string[];
    extensions?: string[];
  };
  detectors?: DetectorConfig[];
}

export interface ScanDirectoryOptions {
  startDirectory: string;
  excludedFolders: string[];
  excludedExtensions: string[];
  verify?: boolean;
  url?: string;
  mask?: boolean;
  core: AhoCorasickCore;
}

export interface CommitInfo {
  hash: string;
  authorName: string;
  authorEmail: string;
  title: string;
  filePath: string | null;
  lineNumber: number;
}

export interface ChangedLine {
  line: string;
  lineNumber: number;
  hash: string;
  authorName: string;
  authorEmail: string;
  title: string;
}

export interface ScanGitCommitsOptions {
  startDirectory: string;
  commitLimit?: number;
  changed?: boolean;
  excludedFolders: string[];
  verify?: boolean;
  url?: string;
  mask?: boolean;
  core: AhoCorasickCore;
}

export interface AnalyzeRepositoryOptions {
  url: string;
  excludedFolders: string[];
  excludedExtensions: string[];
  verify?: boolean;
  mask?: boolean;
  core: AhoCorasickCore;
}
