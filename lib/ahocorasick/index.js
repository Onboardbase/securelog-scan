const AhoCorasick = require("ahocorasick");
const { detectors } = require("../detectors/detectors");

const createDetectorKey = (detector) => {
  return detector.detectorType;
};

/**
 * @todo add fixes for where keywords wasnt found in list of string but there's a secret that matches a pattern
 *
 * E.g paystack secret is generic and doesnt need the keyword paystack
 */

class AhoCorasickCore {
  constructor(customDetectors) {
    this.totalKeywords = [];
    this.trie = null;
    this.keywordsToDetectors = new Map();
    this.detectorsByKey = new Map();

    const allDetectors = detectors;
    if (customDetectors && Array.isArray(customDetectors))
      allDetectors.push(...customDetectors);

    allDetectors.forEach((detector) => {
      const detectorKey = createDetectorKey(detector);
      this.detectorsByKey.set(detectorKey, detector);
      detector.keywords.forEach((keyword) => {
        const keywordLower = keyword.toLowerCase();
        this.totalKeywords.push(keywordLower);
        if (!this.keywordsToDetectors.has(keywordLower)) {
          this.keywordsToDetectors.set(keywordLower, []);
        }
        this.keywordsToDetectors.get(keywordLower).push(detectorKey);
      });
    });

    this.trie = new AhoCorasick(this.totalKeywords);
  }

  // Method to return matching detectors based on the specified input
  findMatchingDetectors(inputString) {
    const lowerInput = inputString.toLowerCase();
    const matches = this.trie.search(lowerInput);

    console.log("matches", matches);

    let detectorKeysTracker = new Set();
    let actualDetectors = new Set();

    const allDetectorKeys = matches.map((match) => {
      const [, [matchString]] = match;
      const detectorKeys = this.keywordsToDetectors.get(matchString);
      return detectorKeys;
    });

    allDetectorKeys.map(([detectorKey]) => {
      if (!detectorKeysTracker.has(detectorKey)) {
        actualDetectors.add(this.detectorsByKey.get(detectorKey));
        detectorKeysTracker.add(detectorKey);
      }
    });

    return Array.from(actualDetectors.values());
  }
}

module.exports = { AhoCorasickCore };
