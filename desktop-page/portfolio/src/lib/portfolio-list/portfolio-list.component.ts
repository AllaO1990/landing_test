import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
import { PORTFOLIO_LIST_CONSTANTS } from './portfolio-list.constants';
import { PortfolioInfoEnum } from './portfolio-list.types';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { LoaderComponent } from '@ui/components/loader';

type PortfolioInfo = {
  [key in PortfolioInfoEnum]: number;
};

@Component({
  selector: 'portfolio-list',
  standalone: true,
  imports: [TuiButton, NgForOf, LoaderComponent, AsyncPipe, TuiFormatNumberPipe, NgIf],
  templateUrl: './portfolio-list.component.html',
  styleUrl: './portfolio-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListComponent {
  readonly size = 's';
  readonly list: PortfolioInfoEnum[] = [
    PortfolioInfoEnum.DEPOSIT,
    PortfolioInfoEnum.DEPOSITED,
    PortfolioInfoEnum.WITHDRAWN,
    PortfolioInfoEnum.COMMISSIONS,
    PortfolioInfoEnum.PROFIT,
    PortfolioInfoEnum.IN_TRANSACTIONS,
    PortfolioInfoEnum.FREE_MONEY,
  ];
  listFirst: PortfolioInfoEnum[] = [PortfolioInfoEnum.DEPOSITED];
  readonly constants = PORTFOLIO_LIST_CONSTANTS;

  @Input() data: PortfolioInfo | null = null;
}
