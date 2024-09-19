const Re2 = require("re2");
const { Client } = require("pg");

const keywords = ["postgres"];
const keyPattern = new Re2(
  /postgres:\/\/(?:[a-zA-Z0-9._%+-]+(?::[a-zA-Z0-9._%+-]+)?@)?[a-zA-Z0-9.-]+(?::\d+)?(?:\/[a-zA-Z0-9._%+-]*)?/,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "PostgreSQL", verified: false };

  for (const match of matches) {
    if (!match) return;
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
          rejectUnauthorized: false,
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
};

const detectorType = "POSTGRESQL_DETECTOR";

module.exports = { scan, keywords, detectorType };
