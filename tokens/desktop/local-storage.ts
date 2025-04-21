import { InjectionToken } from '@angular/core';
import { LocalStorage } from 'storage/local.storage';

export const LOCAL_STORAGE = new InjectionToken<LocalStorage>('LOCAL STORAGE');
