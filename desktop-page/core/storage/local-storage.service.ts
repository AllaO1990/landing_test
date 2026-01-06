import { inject, Injectable, InjectionToken } from '@angular/core';

export const LOCAL_STORAGE = new InjectionToken('localStorage', {
	providedIn: 'root',
	factory: () => localStorage,
});

@Injectable()
export class VtLocalStorageService {
	private readonly _storage: Storage = inject(LOCAL_STORAGE);

	setObject(key: string, object: { [key: string]: any }): void {
		const stringifyObject = JSON.stringify(object);
		this._storage.setItem(key, stringifyObject);
	}

	addOrUpdateObjectProperty(storageKey: string, dataObject: { [prop: string]: any }): void {
		const currentObject = JSON.parse(this._storage.getItem(storageKey) || '{}');

		const stringifyObject = JSON.stringify({ ...currentObject, ...dataObject });
		this._storage.setItem(storageKey, stringifyObject);
	}

	getObject<T = { [key: string]: any }>(key: string): T {
		const stringifyObject = this._storage.getItem(key);
		return JSON.parse(stringifyObject ?? '{}');
	}
}
