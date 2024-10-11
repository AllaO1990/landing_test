import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { TUI_NUMBER_FORMAT, TuiBreakpointService } from '@taiga-ui/core';
import { ChartCandlestickComponent, TabsComponent } from 'ui-common';
import { Observable, of, shareReplay, switchMap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { PortfolioListComponent } from '../portfolio-list/portfolio-list.component';
import { ProfitComponent } from '../profit/profit.component';
import { StructureComponent } from '../structure';
import { ClosedDealsComponent } from '../closed-deals/closed-deals.component';

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
];

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
  providers: [
    {
      provide: TUI_NUMBER_FORMAT,
      useValue: {
        zeroPadding: false,
        decimalLimit: 2,
      },
    },
  ],
})
export class LayoutComponent {
  readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  activeItemIndex = 0;

  readonly tabMobileList: { text: string; icon: string }[] = [
    {
      icon: 'tuiIconTargetLarge',
      text: 'Портфель',
    },
    {
      icon: 'tuiIconListLarge',
      text: 'Структура',
    },
    {
      icon: 'tuiIconChartLineLarge',
      text: 'Прибыль',
    },
    {
      icon: 'tuiIconShoppingCartLarge',
      text: 'Сделки',
    },
    {
      icon: 'tuiIconChartLineLarge',
      text: 'График',
    },
  ];

  readonly tabTabletList: { text: string; icon: string }[] = [
    {
      icon: 'tuiIconTargetLarge',
      text: 'Портфель',
    },
    {
      icon: 'tuiIconShoppingCartLarge',
      text: 'Закрытые сделки',
    },
    {
      icon: 'tuiIconChartLineLarge',
      text: 'График',
    },
  ];

  readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.breakpoint$.pipe(
    map((screen: string | null): { text: string; icon: string }[] | null => {
      if (screen === 'mobile') {
        return this.tabMobileList;
      }

      if (screen === 'desktopSmall') {
        return this.tabTabletList;
      }

      this.activeItemIndex = 0;
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
}
