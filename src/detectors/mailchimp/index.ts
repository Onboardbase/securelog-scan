import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["-us", "mailchimp"];
const keyPattern = new Re2(`[0-9a-f]{32}-us[0-9]{1,2}`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Mailchimp", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    const mailChimpDatacenter = resMatch.split("-")[1];

    if (verify) {
      try {
        await httpClient.get(
          `https://${mailChimpDatacenter}.api.mailchimp.com/3.0/`,
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

const detectorType = "MAILCHIMP_DETECTOR";

export const MailchimpDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
