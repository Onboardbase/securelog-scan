import { RedactionConfig } from "../types";

export const defaultRedactionConfigs: RedactionConfig = {
  // Authentication & Security
  password: {
    pattern: '(?:password|passwd|pwd|secret|auth_token)[=:][^\\s&",}\\]]{3,}',
    replacement: 'password=*****',
    description: 'Matches password and auth token fields'
  },
  apiKey: {
    pattern: '(?:api_?key|client_?secret|access_?token)[=:][^\\s&",}\\]]{3,}',
    replacement: '[API_KEY_REDACTED]',
    description: 'Matches API keys and tokens'
  },
  jwt: {
    pattern: 'eyJ[a-zA-Z0-9_-]{10,}\\.eyJ[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}',
    replacement: '[JWT_REDACTED]',
    description: 'Matches JWT tokens'
  },
  
  // Personal Information
  phone: {
    pattern: '(?:\\+?\\d{1,3}[-\\.\\s]?)?\\(?\\d{3}\\)?[-\\.\\s]?\\d{3}[-\\.\\s]?\\d{4}',
    replacement: 'XXX-XXX-XXXX',
    description: 'Matches phone numbers'
  },
  email: {
    pattern: '[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}',
    replacement: '[EMAIL_REDACTED]',
    description: 'Matches email addresses'
  },
  address: {
    pattern: '\\d{1,5}\\s[\\w\\s,]+(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Dr|Rd|Blvd|Ln|St)\\.?\\s*,?\\s*[\\w\\s]+,\\s*[A-Z]{2}\\s*\\d{5}(-\\d{4})?',
    replacement: '[ADDRESS_REDACTED]',
    description: 'Matches US addresses'
  },
  
  // Financial Information
  creditCard: {
    pattern: '(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})',
    replacement: '[CARD_REDACTED]',
    description: 'Matches major credit card formats'
  },
  bankAccount: {
    pattern: '\\b\\d{8,17}\\b',
    replacement: '[BANK_ACCOUNT_REDACTED]',
    description: 'Matches bank account numbers'
  },
  routingNumber: {
    pattern: '\\b\\d{9}\\b',
    replacement: '[ROUTING_NUMBER_REDACTED]',
    description: 'Matches routing numbers'
  },
  
  // Government IDs
  ssn: {
    pattern: '\\b\\d{3}-?\\d{2}-?\\d{4}\\b',
    replacement: 'XXX-XX-XXXX',
    description: 'Matches SSN'
  },
  ein: {
    pattern: '\\b\\d{2}-?\\d{7}\\b',
    replacement: '[EIN_REDACTED]',
    description: 'Matches EIN'
  },
  passport: {
    pattern: '\\b[A-Z]{1,2}[0-9]{6,9}\\b',
    replacement: '[PASSPORT_REDACTED]',
    description: 'Matches passport numbers'
  },
  
  // Digital Identifiers
  ipv4: {
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    replacement: '[IP_REDACTED]',
    description: 'Matches IPv4 addresses'
  },
  ipv6: {
    pattern: '\\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\\b',
    replacement: '[IPv6_REDACTED]',
    description: 'Matches IPv6 addresses'
  },
  mac: {
    pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\\b',
    replacement: '[MAC_REDACTED]',
    description: 'Matches MAC addresses'
  }
};
