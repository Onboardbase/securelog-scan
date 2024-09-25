import Re2 from "re2";
import { MongoClient } from "mongodb";
import { Detector, ScanResult } from "../../types/detector";

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

    const isLocalInstance = ["127.0.0.1", "localhost"].some((value) =>
      resMatch.includes(value)
    );

    if (verify) {
      if (!isLocalInstance) {
        const client = new MongoClient(resMatch);
        try {
          await client.connect();
          result.verified = true;
        } catch (error) {
        } finally {
          // Disconnect from MongoDB client
          await client.close();
        }
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
