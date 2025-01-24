import { YAMLMap } from "yaml";
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
  fail?: boolean;
}

export interface ScanStringOptions {
  rawValue?: string;
  file?: string;
  updateFile?: boolean;
  config?: string;
  outputFile?: string;
  maskedValue?: string;
  visibleChars?: number;
  customDetectors?: DetectorConfig[];
}

export interface DecayOptions {
  config?: string;
  file?: string;
  data?: any;
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

export interface DataFormat {
  detect: (data: string) => boolean;
  parse: (data: string) => any;
  stringify: (data: any) => string;
}

export type RedactionPattern = {
  pattern: string;  // RE2 compatible pattern
  replacement: string;
  description?: string;
}

export type RedactionConfig = {
  [key: string]: RedactionPattern;
};
