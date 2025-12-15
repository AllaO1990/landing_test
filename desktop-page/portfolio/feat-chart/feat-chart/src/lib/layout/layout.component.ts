import { ChangeDetectionStrategy, Component, inject, input, InputSignal } from '@angular/core';
import { PortfolioChartComponent } from '../chart/chart.component';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiButton } from '@taiga-ui/core';
import { LoaderComponent } from '@ui/components/loader';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { PortfolioData } from '@data-access-portfolio/types';
import { AccountBalanceHistory } from 'types/account';

@Component({
  selector: 'portfolio-chart-layout',
  standalone: true,
  imports: [PortfolioChartComponent, TuiSkeleton, TuiButton, LoaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartLayout {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly data: InputSignal<PortfolioData<AccountBalanceHistory>> = input.required();

  onClose(event: Event): void {
    event.preventDefault();

    this.#queryParams.update({ chart: undefined }, 'merge');
  }
}
