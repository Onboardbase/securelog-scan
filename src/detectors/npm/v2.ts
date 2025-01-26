import { CrossRegex as Re2 } from '../../regex.polyfill';
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["npm_"];
const keyPattern: Re2 = new Re2(`(npm_[0-9a-zA-Z]{36})`, "gi");

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
      version: 2,
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

const detectorType = "NPM_V2_DETECTOR";

export const NpmV2Detector: Detector = {
  scan,
  keywords,
  detectorType,
};
