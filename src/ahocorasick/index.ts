import AhoCorasick from "ahocorasick";
import { Detector } from "../types/detector";
import { detectors } from "../detectors/detectors";

export class AhoCorasickCore {
  private totalKeywords: string[] = [];
  private trie: AhoCorasick | null = null;
  private keywordsToDetectors: Map<string, string[]> = new Map();
  private detectorsByKey: Map<string, Detector> = new Map();

  constructor(customDetectors?: Detector[]) {
    const allDetectors: Detector[] = [...detectors];

    if (customDetectors && Array.isArray(customDetectors)) {
      allDetectors.push(...customDetectors);
    }

    // Populate keywords and build detector maps
    allDetectors.forEach((detector) => {
      if (detector) {
        const detectorKey = detector.detectorType;
        this.detectorsByKey.set(detectorKey, detector);

        detector.keywords.forEach((keyword) => {
          const keywordLower = keyword.toLowerCase();
          this.totalKeywords.push(keywordLower);

          if (!this.keywordsToDetectors.has(keywordLower)) {
            this.keywordsToDetectors.set(keywordLower, []);
          }
          this.keywordsToDetectors.get(keywordLower)?.push(detectorKey);
        });
      }
    });

    // Initialize the Aho-Corasick Trie
    this.trie = new AhoCorasick(this.totalKeywords);
  }

  /**
   * Finds matching detectors based on the input string.
   * @param inputString The input string to search for detectors.
   * @returns An array of matching detectors.
   */
  findMatchingDetectors(inputString: string): Detector[] {
    const lowerInput = inputString.toLowerCase();
    const matches = this.trie?.search(lowerInput) || [];

    const detectorKeysTracker = new Set<string>();
    const actualDetectors = new Set<Detector>();

    matches.forEach((match) => {
      const [, [matchString]] = match;
      const detectorKeys = this.keywordsToDetectors.get(matchString);

      detectorKeys?.forEach((detectorKey) => {
        if (!detectorKeysTracker.has(detectorKey)) {
          const detector = this.detectorsByKey.get(detectorKey);
          if (detector) {
            actualDetectors.add(detector);
            detectorKeysTracker.add(detectorKey);
          }
        }
      });
    });

    return Array.from(actualDetectors);
  }
}
