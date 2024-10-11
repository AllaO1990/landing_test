import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiButtonModule, TuiFormatNumberPipeModule, TuiLoaderModule } from '@taiga-ui/core';
import { PORTFOLIO_LIST_CONSTANTS } from './portfolio-list.constants';
import { PortfolioInfoEnum } from './portfolio-list.types';
import { NgForOf, NgIf } from '@angular/common';
import { LoaderComponent } from '@ui/loader';

type PortfolioInfo = {
  [key in PortfolioInfoEnum]: number;
};

@Component({
  selector: 'portfolio-list',
  standalone: true,
  imports: [TuiButtonModule, NgIf, NgForOf, TuiLoaderModule, TuiFormatNumberPipeModule, LoaderComponent],
  templateUrl: './portfolio-list.component.html',
  styleUrl: './portfolio-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListComponent {
  readonly list: PortfolioInfoEnum[] = [
    PortfolioInfoEnum.DEPOSIT,
    PortfolioInfoEnum.DEPOSITED,
    PortfolioInfoEnum.WITHDRAWN,
    PortfolioInfoEnum.COMMISSIONS,
    PortfolioInfoEnum.PROFIT,
    PortfolioInfoEnum.IN_TRANSACTIONS,
    PortfolioInfoEnum.FREE_MONEY,
  ];
  readonly constants = PORTFOLIO_LIST_CONSTANTS;

  @Input() data: PortfolioInfo | null = null;
}
