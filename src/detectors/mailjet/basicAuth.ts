import Re2 from "re2";
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["mailjet"];
const regexGroup: string = surroundWithGroups(["mailjet"]);

const keyPattern: Re2 = new Re2(regexGroup + /\b([A-Za-z0-9]{87}\=)/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = {
    detectorType: "Mailjet Basic Auth",
    verified: false,
  };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://api.mailjet.com/v3/REST/message", {
          headers: {
            Authorization: `Basic ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }
  return null;
};

const detectorType = "MAILJET_BASIC_AUTH_DETECTOR";

export const MailjetBasicAuthDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
