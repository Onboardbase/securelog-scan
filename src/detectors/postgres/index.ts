import Re2 from "re2";
import { Client } from "pg";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["postgres"];
const keyPattern = new Re2(
  /postgres:\/\/(?:[a-zA-Z0-9._%+-]+(?::[a-zA-Z0-9._%+-]+)?@)?[a-zA-Z0-9.-]+(?::\d+)?(?:\/[a-zA-Z0-9._%+-]*)?/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "PostgreSQL", verified: false };

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
        const client = new Client({
          connectionString: resMatch,
        });
        try {
          await client.connect();
          result.verified = true;
        } catch (error) {
        } finally {
          await client.end();
        }
      }
    }

    return result;
  }

  return null;
};

const detectorType = "POSTGRESQL_DETECTOR";

export const PostgreSQLDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
