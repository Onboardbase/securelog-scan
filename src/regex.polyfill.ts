import RE2 from "re2";
type CrossRegexType = RegExp | RE2;
type RE2BufferExecArray = RegExpExecArray;
type MatchResult = RegExpMatchArray | RE2BufferExecArray | null;

export class CrossRegex implements RegExp {
  private regex: CrossRegexType;

  constructor(pattern: string | RegExp | RE2, flags?: string) {
    this.regex = this.getRegex(pattern, flags);
  }

  // Implement RegExp properties
  get source(): string {
    return this.regex.source;
  }

  get flags(): string {
    return this.regex.flags;
  }

  get global(): boolean {
    return this.regex.global;
  }

  get ignoreCase(): boolean {
    return this.regex.ignoreCase;
  }

  get multiline(): boolean {
    return this.regex.multiline;
  }

  get dotAll(): boolean {
    return (this.regex as RegExp).dotAll || false;
  }

  get unicode(): boolean {
    return (this.regex as RegExp).unicode || false;
  }

  get sticky(): boolean {
    return (this.regex as RegExp).sticky || false;
  }

  get hasIndices(): boolean {
    return (this.regex as RegExp).hasIndices || false;
  }

  get unicodeSets(): boolean {
    return (this.regex as RegExp).unicodeSets || false;
  }

  get lastIndex(): number {
    return this.regex.lastIndex;
  }

  set lastIndex(value: number) {
    this.regex.lastIndex = value;
  }


  private getRegex(pattern: string | RegExp | RE2, flags?: string): CrossRegexType {
    if (typeof window !== 'undefined') {
      // Browser environment: Use native RegExp
      return new RegExp(pattern as string, flags);
    } else {
      // Node.js environment: Use RE2
      return new RE2(pattern, flags);
    }
  }

  // Proxy methods to the underlying regex instance
  exec(str: string): RegExpExecArray | null;
  exec(str: Buffer): RE2BufferExecArray | null;
  exec(str: string | Buffer): RegExpExecArray | RE2BufferExecArray | null {
    if (typeof str === 'string') {
      return this.regex.exec(str);
    } else {
      return (this.regex as RE2).exec(str.toString());
    }
  }

  test(str: string | Buffer): boolean {
    return this.regex.test(typeof str === 'string' ? str : str.toString());
  }

  match(str: string): RegExpMatchArray | null;
  match(str: Buffer): RE2BufferExecArray | null;
  match(str: string | Buffer): MatchResult {
    if (typeof str === 'string') {
      return str.match(this.regex as RegExp);
    } else {
      return (this.regex as RE2).match(str) as unknown as RE2BufferExecArray;
    }
  }

  replace<K extends string | Buffer>(str: K, replaceValue: string | Buffer): K;
  replace<K extends string | Buffer>(
    str: K,
    replacer: (substring: string, ...args: any[]) => string | Buffer
  ): K;
  replace<K extends string | Buffer>(
    str: K,
    replaceValue: string | Buffer | ((substring: string, ...args: any[]) => string | Buffer)
  ): K {
    if (typeof replaceValue === 'function') {
      return (this.regex as RE2).replace(str, replaceValue);
    } else {
      return (this.regex as RE2).replace(str, replaceValue);
    }
  }

  search(str: string | Buffer): number {
    return (this.regex as RE2).search(str);
  }

  split<K extends string | Buffer>(str: K, limit?: number): K[] {
    return (this.regex as RE2).split(str, limit);
  }

  [Symbol.match](str: string): RegExpMatchArray | null;
  [Symbol.match](str: Buffer): RE2BufferExecArray | null;
  [Symbol.match](str: string | Buffer): RegExpMatchArray | RE2BufferExecArray | null {
    if (typeof str === 'string') {
      return str.match(this.regex as RegExp);
    } else {
      if (typeof window !== 'undefined') {
        // Browser environment: Use the polyfill
        const matchResult = (this.regex as RegExp).exec(str.toString());
        if (matchResult) {
          return matchResult;
        }
        return null;
      } else {
        // Node.js environment: Use RE2
        return (this.regex as RE2).match(str) as unknown as RE2BufferExecArray;
      }
    }
  }

  [Symbol.matchAll](str: string): RegExpStringIterator<RegExpMatchArray>;
  [Symbol.matchAll](str: Buffer): RegExpStringIterator<RE2BufferExecArray>;
  [Symbol.matchAll](str: string | Buffer): RegExpStringIterator<RegExpMatchArray | RE2BufferExecArray> {
    if (typeof str === 'string') {
      return str.matchAll(this.regex as RegExp);
    } else {
      throw new Error('matchAll is not supported for Buffer in RE2');
    }
  }

  [Symbol.replace](str: string, replaceValue: string): string;
  [Symbol.replace](str: string, replacer: (substring: string, ...args: any[]) => string): string;
  [Symbol.replace](str: string | Buffer, replaceValue: string | ((substring: string, ...args: any[]) => string)): string | Buffer {
    if (typeof replaceValue === 'function') {
      return (this.regex as RE2).replace(str, replaceValue);
    } else {
      return (this.regex as RE2).replace(str, replaceValue);
    }
  }

  [Symbol.search](str: string | Buffer): number {
    return (this.regex as RE2).search(str);
  }

  [Symbol.split](str: string, limit?: number): string[];
  [Symbol.split](str: Buffer, limit?: number): Buffer[];
  [Symbol.split](str: string | Buffer, limit?: number): string[] | Buffer[] {
    return (this.regex as RE2).split(str, limit) as string[] | Buffer[];
  }

  toString(): string {
    return this.regex.toString();
  }
  compile(): this {
    // RE2 does not support compile, so we just return the instance
    return this;
  }
}
