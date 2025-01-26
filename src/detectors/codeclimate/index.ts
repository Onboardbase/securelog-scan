import { CrossRegex as Re2 } from '../../regex.polyfill';
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["codeclimate"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-f0-9]{40})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Code Climate", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://api.codeclimate.com/v1/user", {
          headers: {
            Authorization: `Token token=${resMatch}`,
          },
        });

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "CODECLIMATE_DETECTOR";

export const CodeClimateDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
