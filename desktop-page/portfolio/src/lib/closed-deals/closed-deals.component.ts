import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { INPUT_DATA } from './constants';
import { DatePipe } from '@angular/common';
import { STOCK_POSITION_TYPE } from 'constants/stock-position-type';
import { GetPositionTypePipe } from '@ui/pipes/get-posiotion-type.pipe';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';

@Component({
  selector: 'portfolio-closed-deals',
  standalone: true,
  imports: [ListComponent, ItemDirective, HeaderComponent, DatePipe, GetPositionTypePipe, GetPositionTypePipe],
  templateUrl: './closed-deals.component.html',
  styleUrl: './closed-deals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {
  readonly positionType = STOCK_POSITION_TYPE;

  @Input() list: any[] = INPUT_DATA;
}
