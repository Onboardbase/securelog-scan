import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["notion"];
const keyPattern: Re2 = new Re2("\\b(secret_[A-Za-z0-9]{43})\\b", "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Notion", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://api.notion.com/v1/users", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
            "Notion-Version": "2022-06-28",
          },
        });
        result.verified = true;
      } catch (error: any) {
        if (error.response && error.response.status === 403)
          result.verified = true;
      }
    }

    return result;
  }

  return null;
};

const detectorType = "NOTION_DETECTOR";

export const NotionDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
