import Re2 from "re2";
import { MongoClient } from "mongodb";
import { Detector, ScanResult } from "../../types/detector";
import { isFalsePositive } from "../../util";

const keywords: string[] = ["mongodb"];
const keyPattern = new Re2(
  /mongodb(?:\+srv)?:\/\/(?:[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?@)?[a-zA-Z0-9._-]+(?::\d+)?(?:\/[a-zA-Z0-9._-]+)?(?:\?[a-zA-Z0-9=&_]+)?/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "MongoDB", verified: false };

  for (const match of matches) {
    if (!match) return null;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    /**
     * If it's a local mongodb URL, continue scanning
     * as localhost urls are publicly accessible hence we dont consider it as
     * a valid secret
     */
    if (isFalsePositive(resMatch, ["127.0.0.1", "localhost"]).isFalsePositive)
      continue;

    if (verify) {
      const client = new MongoClient(resMatch);
      try {
        await client.connect();
        result.verified = true;
      } catch (error) {
      } finally {
        // Disconnect from MongoDB client
        if (result.verified) await client.close();
      }
    }

    return result;
  }
  return null;
};

const detectorType = "MONGODB_DETECTOR";

export const MongoDBDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
