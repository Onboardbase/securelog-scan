import Re2 from "re2";
import { Client } from "pg";
import { Detector, ScanResult } from "../../types/detector";
import { isFalsePositive } from "../../util";
import { DB_CONNECTION_TIMEOUT } from "../../constants";

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

    /**
     * If it's a local postgres URL, continue scanning
     * as localhost urls are publicly accessible hence we dont consider it as
     * a valid secret
     */
    if (isFalsePositive(resMatch, ["127.0.0.1", "localhost"]).isFalsePositive)
      continue;

    if (verify) {
      const client = new Client({
        connectionString: resMatch,
        connectionTimeoutMillis: DB_CONNECTION_TIMEOUT,
      });
      try {
        await client.connect();
        result.verified = true;
      } catch (error) {
      } finally {
        if (result.verified) await client.end();
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
