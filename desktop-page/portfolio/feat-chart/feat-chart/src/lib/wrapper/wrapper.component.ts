import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioChartLayout } from '../layout/layout.component';
import { DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PortfolioData } from '@data-access-portfolio/types';
import { AccountBalanceHistory } from 'types/account';

@Component({
  selector: 'portfolio-chart-wrapper',
  standalone: true,
  imports: [AsyncPipe, PortfolioChartLayout],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartWrapper {
  readonly #store: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);

  readonly data$: Observable<PortfolioData<AccountBalanceHistory>> = this.#store.history$;
}
