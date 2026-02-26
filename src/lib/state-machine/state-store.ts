export interface StateStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  snapshot(): Record<string, unknown>;
}

export class InMemoryStateStore implements StateStore {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.store);
  }
}
