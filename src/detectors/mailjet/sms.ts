import Re2 from "re2";
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["mailjet"];
const regexGroup: string = surroundWithGroups(keywords);
const keyPattern: Re2 = new Re2(regexGroup + /\b([A-Za-z0-9]{32})\b/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "Mailjet SMS", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://api.mailjet.com/v4/sms", {
          headers: {
            Accept: "application/vnd.mailjetsms+json; version=3",
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

const detectorType = "MAILJET_SMS_DETECTOR";

export const MailjetSmsDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
