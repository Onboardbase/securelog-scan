import { CrossRegex as Re2 } from './regex.polyfill';
import { DataFormatHandlers } from './shared';
import { RedactionConfig } from './types';
import { defaultRedactionConfigs } from './shared/default-decay.config';
import yaml from 'js-yaml';
import fs from 'fs';

process.removeAllListeners('warning');

interface YamlConfig {
  patterns: RedactionConfig;
  cache: {
    size: number;
  };
}

export class Decay {
  private readonly configs: RedactionConfig;
  private readonly formatHandlers: DataFormatHandlers;
  private readonly compiledPatterns: Map<string, Re2>;
  private readonly cache: Map<string, string>;
  private readonly cacheSize: number;

  /**
   * Create a new Decay instance from YAML config file or default config
   * @param configPath Optional path to YAML config file
   */
  constructor(configPath?: string) {
    const config = this.loadConfig(configPath);
    this.configs = config.patterns;
    this.formatHandlers = new DataFormatHandlers();
    this.compiledPatterns = this.compilePatterns();
    this.cache = new Map();
    this.cacheSize = config.cache?.size || 1000;
  }

  /**
   * Load configuration from YAML file or use defaults
   */
  private loadConfig(configPath?: string): YamlConfig {
    if (!configPath) {
      return {
        patterns: defaultRedactionConfigs,
        cache: { size: 1000 }
      };
    }

    try {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(fileContents) as YamlConfig;
      
      // Validate the loaded config
      if (!config.patterns || typeof config.patterns !== 'object') {
        throw new Error('Invalid config: missing or invalid patterns section');
      }

      // Validate each pattern
      for (const [key, value] of Object.entries(config.patterns)) {
        if (!value.pattern || !value.replacement) {
          throw new Error(`Invalid config for pattern ${key}: missing pattern or replacement`);
        }
        
        // Validate pattern can be compiled
        try {
          new Re2(value.pattern);
        } catch (error: any) {
          throw new Error(`Invalid regex pattern for ${key}: ${error.message}`);
        }
      }

      return config;
    } catch (error) {
      console.error('Error loading config:', error);
      console.warn('Falling back to default configuration');
      return {
        patterns: defaultRedactionConfigs,
        cache: { size: 1000 }
      };
    }
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
        redactedText = redactedText.replace(pattern as unknown as RegExp, replacement);
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

export const decay = (config?: string)=> new Decay(config);
