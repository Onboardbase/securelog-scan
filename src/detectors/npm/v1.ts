import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["npm"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(
    keywords
  )}\\b([0-9Aa-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "NPM", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = {
      version: 1,
    };

    if (verify) {
      try {
        await httpClient.get("https://registry.npmjs.org/-/whoami", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "NPM_V1_DETECTOR";

export const NpmV1Detector: Detector = {
  scan,
  keywords,
  detectorType,
};
