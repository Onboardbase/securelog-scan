import Re2 from "re2";
import mysql from "mysql2";
import util from "util";
import { Detector, ScanResult } from "../../types/detector";

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

    const isLocalInstance = ["127.0.0.1", "localhost"].some((value) =>
      resMatch.includes(value)
    );

    if (verify) {
      if (!isLocalInstance) {
        const connection = mysql.createConnection(resMatch);
        try {
          const connectAsync = util
            .promisify(connection.connect)
            .bind(connection);
          await connectAsync();
          result.verified = true;
        } catch (error) {
        } finally {
          connection.end();
        }
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
