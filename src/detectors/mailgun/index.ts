import { surroundWithGroups } from "../../regexHandler";
import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["mailgun"];

const regexGroup: string = surroundWithGroups(keywords);
const keyPatterns: Record<string, Re2> = {
  "Original Mailgun Token": new Re2(
    `${regexGroup}\\b([a-zA-Z0-9]{72})\\b`,
    "gi"
  ),
  "Key-Mailgun Token": new Re2("\\b(key-[a-z0-9]{32})\\b", "gi"),
  "Hex Mailgun Token": new Re2(
    "\\b([a-f0-9]{32}-[a-f0-9]{8}-[a-f0-9]{8})\\b",
    "gi"
  ),
};

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  for (const [tokenType, regex] of Object.entries(keyPatterns)) {
    const matches = data.matchAll(regex);
    for (const match of matches) {
      if (!match || match.length !== 2) continue;
      const resMatch = match[1].trim();
      return {
        extras: {
          "Token type": tokenType,
        },
        detectorType: "Mailgun",
        rawValue: resMatch,
        verified: false,
        position: match.index,
      };
    }
  }
  return null;
};

const detectorType = "MAILGUN_DETECTOR";

export const MailgunDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
