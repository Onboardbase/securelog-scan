const Re2 = require("re2");
const redis = require("redis");

const keywords = ["redis"];
const keyPattern = new Re2(
  /redis:\/\/(?:(?:[^:@\s]+)?(?::[^@\s]*)?@)?(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(?::\d+)?(?:\/\d*)?/,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Redis", verified: false };

  for (const match of matches) {
    const resMatch = match[0].trim();
    result.rawValue = resMatch;

    const isLocalInstance = ["127.0.0.1", "localhost"].some((value) =>
      resMatch.includes(value)
    );

    if (verify) {
      /**
       * if its a local redis url, dont try to connect to it
       * as user might not even have redis running locally
       */

      if (!isLocalInstance) {
        let client;

        try {
          client = await redis
            .createClient({ url: resMatch })
            .on("error", (err) => {
              throw new Error(err);
            })
            .connect();

          result.verified = true;
        } catch (error) {
        } finally {
          await client.disconnect();
        }
      }
    }

    return result;
  }
};

const detectorType = "REDIS_DETECTOR";

module.exports = { scan, keywords, detectorType };
