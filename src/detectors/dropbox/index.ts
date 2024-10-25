import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["sl."];
const keyPattern = new Re2(/\b(sl\.[A-Za-z0-9\-\_]{130,140})\b/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Dropbox", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get(
          "https://api.dropboxapi.com/2/users/get_current_account",
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

const detectorType = "DROPBOX_DETECTOR";

export const DropboxDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
