import Re2 from "re2";
import mysql from "mysql2";
import util from "util";
import { Detector, ScanResult } from "../../types/detector";
import { isFalsePositive } from "../../util";

const keywords: string[] = ["mysql"];
const keyPattern = new Re2(
  /mysql:\/\/(?:[a-zA-Z0-9._%+-]+(?::[a-zA-Z0-9._%+-]+)?@)?[a-zA-Z0-9.-]+(?::\d+)?(?:\/[a-zA-Z0-9._%+-]*)?/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "MySQL", verified: false };

  for (const match of matches) {
    if (!match) return null;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    /**
     * If it's a local mysql URL, continue scanning
     * as localhost urls are publicly accessible hence we dont consider it as
     * a valid secret
     */
    if (isFalsePositive(resMatch, ["127.0.0.1", "localhost"]).isFalsePositive)
      continue;

    if (verify) {
      const connection = mysql.createConnection(resMatch);
      try {
        const connectAsync = util
          .promisify(connection.connect)
          .bind(connection);
        await connectAsync();
        result.verified = true;
      } catch (error) {
      } finally {
        /**
         * only try to end connection if secret has been verified which
         * means database connection was successful
         */
        if (result.verified) connection.end();
      }
    }

    return result;
  }
  return null;
};

const detectorType = "MYSQL_DETECTOR";

export const MySQLDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
