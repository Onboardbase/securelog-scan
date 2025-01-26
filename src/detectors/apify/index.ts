import { CrossRegex as Re2 } from '../../regex.polyfill';
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["apify"];
const keyPattern = new Re2(/\b(apify_api_[a-zA-Z0-9]{36})\b/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "Apify", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get(
          `https://api.apify.com/v2/acts?token=${resMatch}&my=true&offset=10&limit=99&desc=true`
        );
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "APIFY_DETECTOR";

export const ApifyDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
