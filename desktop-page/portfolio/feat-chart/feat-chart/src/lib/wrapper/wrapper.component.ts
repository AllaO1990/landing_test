import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PortfolioChartComponent } from '../chart/chart.component';
import { PortfolioData } from '@data-access-portfolio/types';
import { AccountBalanceHistory } from 'types/account';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiButton } from '@taiga-ui/core';
import { LoaderComponent } from '@ui/components/loader';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

@Component({
  selector: 'portfolio-chart-wrapper',
  standalone: true,
  imports: [AsyncPipe, PortfolioChartComponent, TuiSkeleton, TuiButton, LoaderComponent],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartWrapper {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #store: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);

  readonly data$: Observable<PortfolioData<AccountBalanceHistory>> = this.#store.history$;

  onClose(event: Event): void {
    event.preventDefault();

    this.#queryParams.update({ chart: undefined }, 'merge');
  }
}
