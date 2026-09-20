import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const ATTEMPT_WINDOW_MS = 10 * 60 * 1_000;
const MAX_TRACKED_BUCKETS = 10_000;
type AttemptBucket = { attempts: number; expiresAt: number };

@Injectable()
export class AgentPairingLimiter {
  private readonly publicBuckets = new Map<string, AttemptBucket>();
  private readonly authenticatedBuckets = new Map<string, AttemptBucket>();

  assertAllowed(key: string, limit: number, now = Date.now(), scope: 'public' | 'authenticated' = 'public'): void {
    const buckets = scope === 'authenticated' ? this.authenticatedBuckets : this.publicBuckets;
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.expiresAt <= now) buckets.delete(bucketKey);
    }
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= MAX_TRACKED_BUCKETS) this.reject();
      bucket = { attempts: 0, expiresAt: now + ATTEMPT_WINDOW_MS };
      buckets.set(key, bucket);
    }
    bucket.attempts += 1;
    if (bucket.attempts > limit) this.reject();
  }

  private reject(): never {
    throw new HttpException('Too many pairing attempts. Try again in ten minutes.', HttpStatus.TOO_MANY_REQUESTS);
  }
}
