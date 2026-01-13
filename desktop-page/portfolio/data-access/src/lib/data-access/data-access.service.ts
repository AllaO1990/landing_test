import { Injectable, signal, WritableSignal } from '@angular/core';
import { PortfolioParams } from './types';

@Injectable()
export class DataAccessPortfolioService {
	readonly params: WritableSignal<PortfolioParams | null> = signal(null);
}
