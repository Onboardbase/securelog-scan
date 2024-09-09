const AhoCorasick = require("ahocorasick");
const { detectors } = require("../detectors/detectors");

const createDetectorKey = (detector) => {
  return detector.detectorType;
};

class AhoCorasickCore {
  constructor() {
    this.totalKeywords = [];
    this.trie = null;
    this.keywordsToDetectors = new Map();
    this.detectorsByKey = new Map();

    detectors.forEach((detector) => {
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
