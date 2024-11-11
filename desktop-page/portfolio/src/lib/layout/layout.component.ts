import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiBreakpointService } from '@taiga-ui/core';
import { ChartCandlestickComponent, TabsComponent } from 'ui-common';
import { Observable, of, shareReplay, switchMap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { PortfolioListComponent } from '../portfolio-list/portfolio-list.component';
import { ProfitComponent } from '../profit/profit.component';
import { StructureComponent } from '../structure';
import { ClosedDealsComponent } from '../closed-deals';

const INPUT_DATA_PORTFOLIO_LIST = {
  deposit: 1648492,
  deposited: 1940000,
  withdrawn: -392000,
  commissions: -3620,
  profit: 104112,
  inTransactions: 1529000,
  freeMoney: 119492,
};

const INPUT_DATA_PORTFOLIO_STRUCTURE = [
  {
    name: 'Активы',
    value: 'assets',
    list: [
      { name: '1', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
    ],
  },
  {
    name: 'Компании',
    value: 'companies',
    list: [
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
      { name: '7', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '10', value: 10, percentage: 10 },
    ],
  },
  {
    name: 'Отрасли',
    value: 'industries',
    list: [
      { name: '1', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '10', value: 10, percentage: 10 },
    ],
  },
  {
    name: 'Валюта',
    value: 'currency',
    list: [
      { name: '0', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
      { name: '7', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '10', value: 10, percentage: 10 },
      { name: '1', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
      { name: '7', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '10', value: 10, percentage: 10 },
      { name: '1', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
      { name: '7', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '10', value: 10, percentage: 10 },
      { name: '1', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
      { name: '7', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '10', value: 10, percentage: 10 },
      { name: '1', value: 10, percentage: 10 },
      { name: '2', value: 10, percentage: 10 },
      { name: '3', value: 10, percentage: 10 },
      { name: '4', value: 10, percentage: 10 },
      { name: '5', value: 10, percentage: 10 },
      { name: '6', value: 10, percentage: 10 },
      { name: '7', value: 10, percentage: 10 },
      { name: '8', value: 10, percentage: 10 },
      { name: '9', value: 10, percentage: 10 },
      { name: '100', value: 10, percentage: 10 },
    ],
  },
];

const INPUT_DATA_PORTFOLIO_PROFIT = {
  info: {
    today: 123,
    deposited: 123,
    withdrawn: 123,
    commissions: null,
    turnover: 123,
    transactionsCount: 123,
    profitable: 123,
    unprofitable: 123,
  },
  chart: [{ date: '', value: 123 }],
};

@Component({
  selector: 'lib-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    TabsComponent,
    PortfolioListComponent,
    ProfitComponent,
    StructureComponent,
    ClosedDealsComponent,
    ChartCandlestickComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  activeItemIndex = 0;

  readonly tabMobileList: { text: string; icon: string; title: string }[] = [
    {
      icon: '@tui.briefcase',
      title: 'Портфель',
      text: '',
    },
    {
      icon: '@tui.aperture',
      title: 'Структура',
      text: '',
    },
    {
      icon: '@tui.trending-up',
      title: 'Прибыль',
      text: '',
    },
    {
      icon: '@tui.shopping-cart',
      title: 'Сделки',
      text: '',
    },
    {
      icon: '@tui.chart-line',
      title: 'График',
      text: '',
    },
  ];

  readonly tabTabletList: { text: string; icon: string }[] = [
    {
      icon: '@tui.briefcase',
      text: 'Портфель',
    },
    {
      icon: '@tui.aperture',
      text: 'Анатика',
    },
    {
      icon: '@tui.shopping-cart',
      text: 'Закрытые сделки',
    },
    {
      icon: '@tui.chart-line',
      text: 'График',
    },
  ];

  readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.breakpoint$.pipe(
    map((screen: string | null): { text: string; icon: string }[] | null => {
      this.activeItemIndex = 0;

      if (screen === 'mobile') {
        return this.tabMobileList;
      }

      if (screen === 'desktopSmall') {
        return this.tabTabletList;
      }

      return null;
    })
  );

  readonly dataPortfolioList$: Observable<any> = timer(1500).pipe(
    switchMap((_) => of(INPUT_DATA_PORTFOLIO_LIST)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly dataPortfolioStructure$: Observable<any> = timer(1300).pipe(
    switchMap((_) => of(INPUT_DATA_PORTFOLIO_STRUCTURE)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly dataPortfolioProfit$: Observable<any> = timer(1300).pipe(switchMap((_) => of(INPUT_DATA_PORTFOLIO_PROFIT)));
}
