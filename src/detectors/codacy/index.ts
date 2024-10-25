import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["codacy"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([0-9A-Za-z]{20})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Codacy", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://app.codacy.com/api/v3/user", {
          headers: {
            "api-token": resMatch,
          },
        });

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "CODACY_DETECTOR";

export const CodacyDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
