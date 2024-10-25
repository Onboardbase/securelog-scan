import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["digitalocean"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(["do", "ocean"])}\\b([A-Za-z0-9_-]{64})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Digitalocean", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = {
      version: 1,
    };

    if (verify) {
      try {
        await httpClient.get("https://api.digitalocean.com/v2/account", {
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

const detectorType = "DIGITALOCEAN_V1_DETECTOR";

export const DigitaloceanV1Detector: Detector = {
  scan,
  keywords,
  detectorType,
};
