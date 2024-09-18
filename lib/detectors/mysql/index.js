const Re2 = require("re2");
const mysql = require("mysql");
const util = require("util");

const keywords = ["mysql"];
const keyPattern = new Re2(
  /mysql:\/\/(?:[a-zA-Z0-9._%+-]+(?::[a-zA-Z0-9._%+-]+)?@)?[a-zA-Z0-9.-]+(?::\d+)?(?:\/[a-zA-Z0-9._%+-]*)?/,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "MySQL", verified: false };

  for (const match of matches) {
    if (!match) return;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;

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
          // silently kill errors
        } finally {
          connection.end();
        }
      }
    }

    return result;
  }
};

const detectorType = "MYSQL_DETECTOR";

module.exports = { scan, keywords, detectorType };
