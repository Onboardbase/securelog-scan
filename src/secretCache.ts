import { ScanResult } from "./types/detector";

export class SLSCache {
  private secrets: ScanResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  public startTracking(): void {
    this.startTime = performance.now();
  }

  public stopTracking(): void {
    this.endTime = performance.now();
  }

  public addSecret(secret: ScanResult): void {
    this.secrets.push(secret);
  }

  public getAllSecrets(): ScanResult[] {
    return this.secrets;
  }

  public getVerifiedSecretCount(): number {
    return this.secrets.filter((secret) => secret.verified).length;
  }

  public getUnverifiedSecretCount(): number {
    return this.secrets.filter((secret) => !secret.verified).length;
  }

  public getScanDuration(): string {
    const duration = (this.endTime - this.startTime) / 1000;
    return `${duration.toFixed(2)} seconds`;
  }
}

export const SecretCache = new SLSCache();
