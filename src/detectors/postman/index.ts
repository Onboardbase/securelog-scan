import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["postman", "PMAK-"];
const keyPattern = new Re2(/\b(PMAK-[a-zA-Z0-9]{59})\b/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Postman", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;
    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get("https://api.getpostman.com/collections", {
          headers: {
            "x-api-key": resMatch,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "POSTMAN_DETECTOR";

export const PostmanDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
