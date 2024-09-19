const Re2 = require("re2");
const { MongoClient } = require("mongodb");

const keywords = ["mongodb"];
const keyPattern = new Re2(
  /mongodb(?:\+srv)?:\/\/(?:[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?@)?[a-zA-Z0-9._-]+(?::\d+)?(?:\/[a-zA-Z0-9._-]+)?(?:\?[a-zA-Z0-9=&_]+)?/,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "MongoDB", verified: false };

  for (const match of matches) {
    if (!match) return;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;

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
          // disconnect from mongodb client
          client.close();
        }
      }
    }

    return result;
  }
};

const detectorType = "MONGODB_DETECTOR";

module.exports = { scan, keywords, detectorType };
