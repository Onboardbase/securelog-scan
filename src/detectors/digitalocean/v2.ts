import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

// https://docs.digitalocean.com/reference/api/api-reference/#section/Authentication
const keywords: string[] = ["dop_v1_", "doo_v1_", "dor_v1_"];
const keyPattern: Re2 = new Re2(
  "\\b((?:dop|doo|dor)_v1_[a-f0-9]{64})\\b",
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
      version: 2,
    };

    if (verify) {
      try {
        if (resMatch.startsWith("dor_v1_")) {
          await axios.get(
            `https://cloud.digitalocean.com/v1/oauth/token?grant_type=refresh_token&refresh_token=${resMatch}`
          );
        }

        if (resMatch.startsWith("doo_v1_") || resMatch.startsWith("dop_v1_")) {
          await axios.get("https://api.digitalocean.com/v2/account", {
            headers: {
              Authorization: `Bearer ${resMatch}`,
            },
          });
        }

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "DIGITALOCEAN_V2_DETECTOR";

export const DigitaloceanV2Detector: Detector = {
  scan,
  keywords,
  detectorType,
};
