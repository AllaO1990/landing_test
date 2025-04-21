import { inject, Injectable } from '@angular/core';
import { WINDOW } from 'tokens/desktop';

@Injectable()
export class LocalStorage implements Storage {
  readonly #storage = inject(WINDOW).localStorage;

  length: number = this.#storage.length;

  clear(): void {
    this.#storage.clear();
  }

  getItem(key: string): string | any | null {
    const value: string | null = this.#storage.getItem(key);

    try {
      return value && JSON.parse(value);
    } catch (ex) {
      return new Function(`return ${value}`)();
    }
  }

  key(index: number): string | null {
    return this.#storage.key(index);
  }

  removeItem(key: string): void {
    return this.#storage.removeItem(key);
  }

  setItem(key: string, value: string | object | null): void {
    if (typeof value === 'object') {
      this.#storage.setItem(key, JSON.stringify(value));
      return;
    }

    this.#storage.setItem(key, value);
  }
}
