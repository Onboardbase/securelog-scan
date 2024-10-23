import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";

const keywords: string[] = ["cloudflare"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([A-Za-z0-9_-]{40})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Cloudflare", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get(
          "https://api.cloudflare.com/client/v4/user/tokens/verify",
          {
            headers: {
              Authorization: `Bearer ${resMatch}`,
            },
          }
        );

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "CLOUDFLARE_DETECTOR";

export const CloudflareDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
