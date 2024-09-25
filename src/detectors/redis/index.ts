import Re2 from "re2";
import { createClient } from "redis";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["redis"];
const keyPattern = new Re2(
  /redis:\/\/(?:(?:[^:@\s]+)?(?::[^@\s]*)?@)?(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(?::\d+)?(?:\/\d*)?/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Redis", verified: false };

  for (const match of matches) {
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    const isLocalInstance = ["127.0.0.1", "localhost"].some((value) =>
      resMatch.includes(value)
    );

    if (verify) {
      /**
       * If it's a local Redis URL, don't try to connect to it
       * as the user might not even have Redis running locally.
       */
      if (!isLocalInstance) {
        let client;

        try {
          client = createClient({ url: resMatch });
          client.on("error", (err) => {
            throw new Error(err);
          });
          await client.connect();

          result.verified = true;
        } catch (error) {
        } finally {
          await client?.disconnect();
        }
      }
    }

    return result;
  }

  return null;
};

const detectorType = "REDIS_DETECTOR";

export const RedisDetector: Detector = {
  scan,
  keywords,
  detectorType,
};