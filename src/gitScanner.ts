import { spawn } from "child_process";
import readline from "readline";
import path from "path";
import fs from "fs";
import { AhoCorasickCore } from "./ahocorasick";
import { CommitInfo, ChangedLine, ScanGitCommitsOptions } from "./types";
import { EScannerTypes, ScanResult } from "./types/detector";
import { EventManager } from "./events";

/**
 * Run a Git command and process the output line by line.
 */
const runGitCommand = (
  repoPath: string,
  gitArgs: string[],
  lineHandler: (line: string) => void,
  excludedFolders: string[]
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn("git", gitArgs, { cwd: repoPath });
    const rl = readline.createInterface({
      input: gitProcess.stdout,
      terminal: false,
    });

    rl.on("line", (line) => {
      const isExcluded = excludedFolders.some((folder) =>
        line.includes(folder.trim())
      );
      if (!isExcluded) lineHandler(line);
    });

    rl.on("close", resolve);

    gitProcess.on("error", (err) =>
      reject(`Error executing git log: ${err.message}`)
    );
    gitProcess.stderr.on("data", (data) =>
      reject(`Error executing git log: ${data.toString()}`)
    );
  });
};

const scanLineForSecrets = async (
  line: string,
  commitInfo: CommitInfo,
  filePath: string,
  isUrl: boolean,
  verify: boolean | undefined,
  core: AhoCorasickCore,
  mask: boolean | undefined
): Promise<void> => {
  const detectors = core.findMatchingDetectors(line);

  await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(verify, line);

      if (scanResponse && scanResponse.rawValue) {
        EventManager.emitNewSecret({
          ...scanResponse,
          filePath,
          mask,
          isUrl,
          scannerType: EScannerTypes.GIT_SCANNER,
          commitInfo,
        });
      }
    })
  );
};

const getChangedLinesWithDetails = async (
  repoPath: string,
  excludedFolders: string[]
): Promise<Record<string, ChangedLine[]>> => {
  const changedLines: Record<string, ChangedLine[]> = {};
  const gitArgs = [
    "log",
    "-p",
    "--first-parent",
    '--format="%H|%an|%ae|%s"',
    "origin/main..HEAD",
  ];
  let currentFile: string | null = null;
  let commitInfo: CommitInfo | null = null;
  let lineOffset = 0;

  const lineHandler = (line: string) => {
    if (line.includes("|")) {
      const [commitHash, authorName, authorEmail, commitTitle] =
        line.split("|");
      commitInfo = {
        hash: commitHash,
        authorName,
        authorEmail,
        title: commitTitle,
        filePath: null,
        lineNumber: 0,
      };
    } else if (line.startsWith("diff --git")) {
      const fileMatch = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
      if (fileMatch) currentFile = fileMatch[2];
    } else if (line.startsWith("@@")) {
      const lineMatch = /^@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(line);
      if (lineMatch && currentFile && commitInfo) {
        lineOffset = parseInt(lineMatch[1], 10);
        if (!changedLines[currentFile]) changedLines[currentFile] = [];
      }
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      if (currentFile && commitInfo) {
        const addedLine = line.slice(1);
        commitInfo.lineNumber = lineOffset;
        changedLines[currentFile].push({ ...commitInfo, line: addedLine });
        lineOffset++;
      }
    }
  };

  await runGitCommand(repoPath, gitArgs, lineHandler, excludedFolders);
  return changedLines;
};

const scanChangedLinesInFiles = async (
  changedFiles: Record<string, ChangedLine[]>,
  repoPath: string,
  verify: boolean | undefined,
  core: AhoCorasickCore,
  mask: boolean | undefined
): Promise<void> => {
  for (const [filePath, lines] of Object.entries(changedFiles)) {
    if (fs.existsSync(repoPath)) {
      for (const {
        line,
        lineNumber,
        hash,
        authorName,
        authorEmail,
        title,
      } of lines) {
        await scanLineForSecrets(
          line,
          { lineNumber, hash, authorName, authorEmail, title, filePath },
          filePath,
          false,
          verify,
          core,
          mask
        );
      }
    }
  }
};

export const scanGitCommitsForSecrets = async ({
  startDirectory,
  commitLimit = 100,
  changed,
  excludedFolders,
  verify,
  url,
  mask,
  core,
}: ScanGitCommitsOptions): Promise<void> => {
  if (changed) {
    const changedFiles = await getChangedLinesWithDetails(
      startDirectory,
      excludedFolders
    );
    await scanChangedLinesInFiles(
      changedFiles,
      startDirectory,
      verify,
      core,
      mask
    );
    return;
  }

  const gitArgs = [
    "log",
    "-p",
    `--max-count=${commitLimit}`,
    "--pretty=format:commit %H|%an|%ae|%s",
  ];
  let currentCommit: CommitInfo | null = null;

  const lineHandler = (line: string) => {
    if (line.startsWith("commit")) {
      const [hash, authorName, authorEmail, title] = line
        .substring(7)
        .split("|");
      currentCommit = {
        hash,
        authorName,
        authorEmail,
        title,
        filePath: null,
        lineNumber: 0,
      };
    } else if (line.startsWith("diff --git")) {
      if (currentCommit)
        currentCommit.filePath = path.join(
          startDirectory,
          line.split(" ")[2].substring(2)
        );
    } else if (line.startsWith("@@")) {
      const lineMatch = /^@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(line);
      if (lineMatch && currentCommit)
        currentCommit.lineNumber = parseInt(lineMatch[1], 10);
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      if (currentCommit && currentCommit.filePath) {
        const trimmedLine = line.slice(1).trim();
        scanLineForSecrets(
          trimmedLine,
          currentCommit,
          currentCommit.filePath,
          !!url,
          verify,
          core,
          mask
        );
        currentCommit.lineNumber++;
      }
    }
  };

  await runGitCommand(startDirectory, gitArgs, lineHandler, excludedFolders);
};
