import { RateLimitRecord } from "../../types/rateLimiter.types.js";

class MemoryStore {
  private readonly store = new Map<string, RateLimitRecord>();
  set(key: string, value: RateLimitRecord): void {
    this.store.set(key, value);
  }
  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }
  delete(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const memoryStore = new MemoryStore();
export default memoryStore;
