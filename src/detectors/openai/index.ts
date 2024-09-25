import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["T3BlbkFJ"];
const keyPattern = new Re2(
  /\b(sk-[a-zA-Z0-9_-]+T3BlbkFJ[a-zA-Z0-9_-]+)\b/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "OpenAI", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        const { data: userData } = await axios.get(
          "https://api.openai.com/v1/me",
          {
            headers: {
              Authorization: `Bearer ${resMatch}`,
            },
          }
        );
        result.verified = true;

        result.extras = {
          id: userData.id,
          mfa_enabled: userData.mfa_flag_enabled,
          created_at: new Date(userData.created).toLocaleDateString(),
          total_orgs: userData.orgs.data.length,
          ...(userData.orgs.data.length && {
            description: userData.orgs.data[0].description,
            is_personal: userData.orgs.data[0].personal,
            is_default: userData.orgs.data[0].is_default,
          }),
        };
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "OPENAI_DETECTOR";

export const OpenAIDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
