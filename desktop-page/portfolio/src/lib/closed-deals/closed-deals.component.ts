import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { INPUT_DATA } from './constants';
import { STOCK_POSITION_TYPE } from 'constants/stock-position-type';
import { WrapperListComponent } from './list/list.component';
import { WrapperTableComponent } from './table/table.component';

@Component({
  selector: 'portfolio-closed-deals',
  standalone: true,
  imports: [WrapperListComponent, WrapperTableComponent],
  templateUrl: './closed-deals.component.html',
  styleUrl: './closed-deals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {
  readonly positionType = STOCK_POSITION_TYPE;

  @Input() list: any[] = INPUT_DATA;
}
