export class Queue<K = string, T = unknown> {
  private _limit: number = 3;
  private _direction: K[] = [];
  private _setQueue: Map<K, T> = new Map();

  constructor(limit: number = 3) {
    this._limit = limit;
  }

  changeLimit(limit: number): void {
    this._limit = limit;
  }

  getValue(key: K): T | null {
    if (this._setQueue.has(key)) {
      return this._setQueue.get(key) as T;
    }

    return null;
  }

  setValue(key: K, value: T): void {
    if (this._setQueue.has(key)) {
      this._setQueue.set(key, value);

      return;
    }

    this._direction.push(key);

    if (this._direction.length > this._limit) {
      const [first, ...other] = this._direction;

      this._setQueue.delete(first);
      this._direction = other;
    }

    this._setQueue.set(key, value);
  }

  reset(): void {
    this._setQueue.clear();
  }
}
