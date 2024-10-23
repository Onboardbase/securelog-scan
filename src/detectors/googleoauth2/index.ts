import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["ya29."];
const keyPattern = new Re2(/ya29\.[\w\-\.]+/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Google Oauth2", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        const { data } = await axios.get(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${resMatch}`
        );

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "GOOGLE_OAUTH2_DETECTOR";

export const GoogleOauth2Detector: Detector = {
  scan,
  keywords,
  detectorType,
};