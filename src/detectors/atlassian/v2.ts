import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["ATCTT3xFfG"];
const keyPattern = new Re2(
  /\b(ATCTT3xFfG[A-Za-z0-9+/=_-]+=[A-Za-z0-9]{8})\b/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "Atlassian", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = {
      version: 2,
    };

    if (verify) {
      try {
        const { data } = await axios.get(
          "https://api.atlassian.com/admin/v1/orgs",
          {
            headers: {
              Authorization: `Bearer ${resMatch}`,
            },
          }
        );

        console.log(data);
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "ATLASSIAN_V2_DETECTOR";

export const AtlassianV2Detector: Detector = {
  scan,
  keywords,
  detectorType,
};
