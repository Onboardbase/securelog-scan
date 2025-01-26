# Contributors guide to creating a secret detectors.


## Core Types

```ts
// Base interface for all secrets detection results
export interface ScanResult {
  detectorType: string; // Unique identifier for the detector
  rawValue?: string; // The detected secret value
  verified: boolean; // Whether the secret has been verified
  position?: number; // Position in the scanned text
  extras?: {
    version?: number; // Optional version tracking
    [key: string]: any; // Additional metadata
  };
}

// Interface that all detectors must implement
export interface Detector {
  detectorType: string; // Unique identifier for the detector
  keywords: string[]; // Trigger words for scanning
  scan: (
    verify: boolean | undefined,
    data: string
  ) => Promise<ScanResult | null>;
}
```
---

## Project Structure

```text
securelog-scan/
├── src/
│   ├── detectors/
│   │   ├── detectors.ts        # Central registry of all detectors
│   │   └── [service-name]/     # Individual detector implementations
│   │       └── index.ts
│   ├── types/
│   │   └── detector.ts         # Core type definitions
│   ├── regexHandler.ts         # Regex utilities
│   └── util/
│       └── httpClient.ts       # HTTP client for verification
```
---

# Implementation Guide

## Pattern Matching Utility

Securelog scan uses a flexible pattern-matching system that combines keywords and boundary groups.

```ts
const surroundWithGroups = (keywords: string[]): string => {
  const middle = keywords.join("|");
  return `(?:${middle})(?:.|[\\n\\r]){0,40}?`;
};
```
---

This function:

- Takes an array of keywords
- Creates a non-capturing group `(?:)` with keywords joined by OR (`|`)
- Adds a lookahead group that matches up to 40 characters, including newlines
- Helps reduce false positives by ensuring matches are within reasonable boundaries

```text
NOTE: Not all detectors require the `surroundWithGroups` utility. Use it when:

- Your secret pattern doesn't have a consistent prefix (like `pk_` or `sk_`)
- You need to match secrets that might appear after varying keywords
- The secret format is loosely structured but appears near specific keywords

For secrets with strict formats (like API keys that always start with specific prefixes), direct pattern matching is more appropriate.

COMPARE:
- Stripe: Uses direct pattern `[r]k_(live|test)_[a-zA-Z0-9]{20,247}` because keys always follow this format
 - Miro: Uses `surroundWithGroups` because the token can appear after various forms of "miro" in the text
```
---

## Pattern Matching Concepts

### Generic Pattern Matching

- Use `surroundWithGroups` for flexible keyword matching
- Add word boundaries (`\b`) to ensure complete token matches
- Consider environment indicators (test/live/prod)
- Use specific character length ranges when known

### Pattern Variations

1. Direct Matching:

```ts
const pattern = new Re2(`specific_prefix_[a-zA-Z0-9]{32}`, "gi");
```

2. Flexible Matching with Keywords:

```ts
const pattern = new Re2(
  `${surroundWithGroups(keywords)}\\b([0-9a-zA-Z]{specified_length})\\b`,
  "gi"
);
```

3. Environment-Aware Matching:

```ts
const pattern = new Re2(
  `prefix_(live|test|prod)_[a-zA-Z0-9]{length_range}`,
  "gi"
);
```
---

## Building A Detector

1. Create detector directory:

```text
mkdir src/detectors/your-service-name
```

2. Implementation template:

```ts
import { crossRegex as Re2 } from '../../util';
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords = ["your_keyword"];
const keyPattern = new Re2(
  `${surroundWithGroups(keywords)}\\b([your-pattern])\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern as unknown as RegExp);
  const result: ScanResult = {
    detectorType: "YOUR_SERVICE",
    verified: false,
  };

  for (const match of matches) {
    if (!match) continue;

    result.rawValue = match[1].trim();
    result.position = match.index;

    if (verify) {
      try {
        // Verification API call
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

export const YourDetector: Detector = {
  scan,
  keywords,
  detectorType: "YOUR_DETECTOR",
};
```
3. Register in `detectors.ts`:

```ts
import { YourDetector } from "./your-service-name";

export const detectors = [
  // ... existing detectors
  YourDetector,
];
```

## Best Practices

### Pattern Design

- Use `surroundWithGroups` for flexible matching
- Add word boundaries to prevent partial matches
- Consider common variations and formats
- Be specific with character lengths when possible

### Verification

- Implement when API endpoints are available
- Use read-only API endpoints
- Handle rate limits appropriately
- Implement proper error handling
- Don't expose verification errors

### Performance

- Use efficient regex patterns
- Avoid excessive backtracking
- Return early when match is found
- Handle large files efficiently

### Security

- Clear sensitive data from memory
- Use secure API calls for verification
- Handle errors securely

### Testing

- Include positive and negative cases
- Test boundary conditions
- Verify error handling
- Test with verification enabled/disabled
