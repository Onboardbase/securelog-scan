import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["chatbot"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-zA-Z0-9_]{32})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Chatbot.com", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://api.chatbot.com/stories", {
          headers: {
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

const detectorType = "CHATBOT_DETECTOR";

export const ChatbotDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
