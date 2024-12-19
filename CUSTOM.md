# How to build custom detectors using the Securelog yml config file

Securelog scan allows you to define custom detectors using a YAML configuration file, making it easy to scan for organization-specific secrets or APIs not yet covered by the built-in detectors.

## Usage
```ts
sls scan --dir . --config "sls.config.yml"
```
---

## Configuration File Structure

Create a `sls.config.yml` file with the following structure:
```yaml
detectors:
  detector_name:
    regex: string | object
    keywords: string[]
    detectorType: string
    group?: string[] # Optional

exclude:
  paths: string[]
  extensions: string[]
```
---

## Defining Detectors

### Basic Detector
```yaml
detectors:
  paystack:
    regex: "\\bsk\\_[a-z]{1,}\\_[A-Za-z0-9]{40}\\b"
    keywords: ["paystack"]
    detectorType: "Paystack"
```
---

### Multiple Patterns Detector
```yaml
detectors:
  mailgun:
    regex:
      "Original Token": "\\b([a-zA-Z-0-9]{72})\\b"
      "Key-Mailgun Token": "\\b(key-[a-z0-9]{32})\\b"
      "Hex Mailgun Token": "\\b([a-f0-9]{32}-[a-f0-9]{8}-[a-f0-9]{8})\\b"
    keywords: ["mailgun"]
    detectorType: "Mailgun"
```
---

## Configuration Fields

### Detector Properties

- `regex`: String or object containing regex patterns
  - Single pattern: Use a string value
  - Multiple patterns: Use an object with named patterns
- `keywords`: Array of trigger words for the detector
- `detectorType`: Unique identifier for the detector
- `group`: Optional array for grouping related patterns

### Exclusions

- `paths`: Directories to skip during scanning
- `extensions`: File types to ignore

## Pattern Writing Guidelines

1. Always use double escaped backslashes (`\\b` not `\b`)
2. Use word boundaries (`\\b`) to prevent partial matches
3. Be specific with character classes and lengths
4. Consider all possible format variations

## Examples

### Single Pattern Detector
```yaml
detectors:
  custom_api:
    regex: "\\bapi_[a-zA-Z0-9]{32}\\b"
    keywords: ["custom_api"]
    detectorType: "CustomAPI"
```
---
### Multiple Patterns with Groups
```yaml
detectors:
  internal_service:
    regex:
      "Production": "\\bprod_[a-zA-Z0-9]{40}\\b"
      "Staging": "\\bstg_[a-zA-Z0-9]{40}\\b"
    keywords: ["internal"]
    detectorType: "InternalService"
    group: ["internal_keys"]
```
---
### Complete Configuration
```yaml
detectors:
  paystack:
    regex: "\\bsk\\_[a-z]{1,}\\_[A-Za-z0-9]{40}\\b"
    keywords: ["paystack"]
    detectorType: "Paystack"

  mailgun:
    regex:
      "Original Token": "\\b([a-zA-Z-0-9]{72})\\b"
      "Key-Mailgun Token": "\\b(key-[a-z0-9]{32})\\b"
    keywords: ["mailgun"]
    detectorType: "Mailgun"

exclude:
  paths:
    - "node_modules"
    - "dist"
  extensions:
    - ".png"
    - ".jpg"
    - ".log"
```
---

## Best Practices

1. **Pattern Design**

   - Use word boundaries (`\\b`) to prevent false positives
   - Be specific with character lengths
   - Include environment indicators when applicable
   - Group related patterns together

2. **Keywords**

   - Include common variations of service names
   - Consider abbreviated forms
   - Include relevant environment terms

3. **Exclusions**

   - Exclude build directories
   - Skip binary and media files
   - Ignore log files to prevent noise

4. **Maintenance**
   - Document pattern explanations
   - Group related services
   - Update patterns when token formats change

## Common Issues and Solutions

1. **False Positives**

   - Make patterns more specific
   - Use word boundaries
   - Include service-specific prefixes

2. **Missing Matches**

   - Check for format variations
   - Include all possible prefixes
   - Consider case sensitivity

3. **Performance**
   - Exclude unnecessary directories
   - Be specific with file extensions
   - Use efficient regex patterns
