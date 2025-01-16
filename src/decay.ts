import Re2 from 're2';
import { DataFormatHandlers } from './shared';
import { RedactionConfig } from './types';

// Extended RE2-compatible patterns optimized for performance
const defaultRedactionConfigs: RedactionConfig = {
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

class Decay {
  private readonly configs: RedactionConfig;
  private readonly formatHandlers: DataFormatHandlers;
  private readonly compiledPatterns: Map<string, Re2>;
  private readonly cache: Map<string, string>;
  private readonly cacheSize: number;

  constructor(
    configs: RedactionConfig = defaultRedactionConfigs,
    cacheSize: number = 1000
  ) {
    this.configs = configs;
    this.formatHandlers = new DataFormatHandlers();
    this.compiledPatterns = this.compilePatterns();
    this.cache = new Map();
    this.cacheSize = cacheSize;
  }

  /**
   * Compiles patterns using RE2 with optimization flags
   */
  private compilePatterns(): Map<string, Re2> {
    const compiled = new Map();
    for (const [key, config] of Object.entries(this.configs)) {
      try {
        // Use RE2 optimization flags
        compiled.set(key, new Re2(config.pattern));
      } catch (error) {
        console.error(`Failed to compile pattern for ${key}:`, error);
      }
    }
    return compiled;
  }

  /**
   * Generates cache key for input data
   */
  private generateCacheKey(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }

  /**
   * Main redaction function with caching
   */
  public redact(data: any): any {
    const cacheKey = this.generateCacheKey(data);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return this.intelligentParse(cached, 'string');
    }

    try {
      const { stringified, format } = this.intelligentStringify(data);
      const redacted = this.redactSensitiveData(stringified);
      
      // Cache the result
      if (this.cache.size >= this.cacheSize) {
        const firstKey = this.cache.keys().next().value;
        if(firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, redacted);
      
      return this.intelligentParse(redacted, format);
    } catch (error) {
      console.error('Error during redaction:', error);
      const fallback = this.redactSensitiveData(String(data));
      return fallback;
    }
  }

  /**
   * Optimized redaction using compiled RE2 patterns
   */
  private redactSensitiveData(text: string): string {
    let redactedText = text;
    
    // Sort patterns by length for better matching
    const sortedPatterns = Array.from(this.compiledPatterns.entries())
      .sort(([, a], [, b]) => b.toString().length - a.toString().length);

    for (const [key, pattern] of sortedPatterns) {
      const replacement = this.configs[key].replacement;
      try {
        redactedText = redactedText.replace(pattern, replacement);
      } catch (error) {
        console.warn(`Pattern ${key} failed:`, error);
      }
    }

    return redactedText;
  }

  /**
   * Enhanced string conversion with format detection
   */
  private intelligentStringify(data: any): { stringified: string; format: string } {
    if (typeof data === 'string') {
      const format = this.formatHandlers.detectFormat(data);
      return { stringified: data, format };
    }

    const jsonString = JSON.stringify(data, null, 2);
    return { stringified: jsonString, format: 'json' };
  }

  /**
   * Intelligent parsing based on detected format
   */
  private intelligentParse(text: string, format: string): any {
    const handler = this.formatHandlers.getHandler(format);
    if (handler) {
      try {
        return handler.parse(text);
      } catch (error) {
        console.warn(`Failed to parse as ${format}, falling back to string`);
      }
    }
    return text;
  }

}

// Performance test suite
function runPerformanceTest(redactor: Decay) {
  const testCases = {
    simple: "Email: test@example.com",
    complex: {
      users: Array(1000).fill(null).map((_, i) => ({
        id: i,
        email: `user${i}@example.com`,
        password: `secret${i}`,
        ssn: "123-45-6789",
        creditCard: "4111-1111-1111-1111",
        address: "123 Main St, New York, NY 12345",
      }))
    },
    nested: {
      level1: {
        level2: {
          level3: {
            data: Array(100).fill({
              apiKey: "sk_test_123456789",
              jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
            })
          }
        }
      }
    }
  };

  console.time('Initial redaction');
  redactor.redact(testCases.complex);
  console.timeEnd('Initial redaction');

  console.time('Cached redaction');
  redactor.redact(testCases.complex);
  console.timeEnd('Cached redaction');

  console.time('Nested redaction');
  redactor.redact(testCases.nested);
  console.timeEnd('Nested redaction');
}

// Example usage
const redactor = new Decay();
runPerformanceTest(redactor);

// Complex example with multiple data types
const complexData = {
  user: {
    personal: {
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      ssn: "123-45-6789",
      passport: "AB1234567",
    },
    financial: {
      creditCard: "4111-1111-1111-1111",
      bankAccount: "12345678901234",
      routingNumber: "123456789"
    },
    security: {
      password: "secret123",
      apiKey: "sk_live_1234567890",
      jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
    network: {
      ipv4: "192.168.1.1",
      ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      mac: "00:1A:2B:3C:4D:5E"
    }
  }
};

console.log('\nComplex Example:');
console.log(JSON.stringify(redactor.redact(complexData), null, 2));