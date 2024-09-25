import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["gemini", "master-", "account-"];

const keyPattern = new Re2(/\b((?:master-|account-)[0-9A-Za-z]{20})\b/, "gi");
const secretPattern: Re2 = new Re2("[A-Za-z0-9]{27,28}", "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const secretMatches = data.matchAll(secretPattern);
  let result: ScanResult = { detectorType: "Gemini", verified: false };

  for (const match of matches) {
    if (!match || match.length !== 2) continue;
    const resMatch = match[1].trim();

    result.rawValue = resMatch;
    result.position = match.index;

    for (const secretMatch of secretMatches) {
      const secretMatchValue = secretMatch[0].trim();
      result.rawValue = resMatch + " " + secretMatchValue;

      if (verify) {
        // No verification for now
      }

      return result;
    }
  }

  return null;
};

const detectorType = "GEMINI_DETECTOR";

export const GeminiDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
