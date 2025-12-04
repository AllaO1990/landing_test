import { TuiFormatNumberPipe } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { GetPositionTypePipe } from '@ui/pipes/get-posiotion-type.pipe';
import { GetStrategyNamePipe } from '@ui/pipes/get-strategy-name.pipe';
import { HeaderComponent, UiListItem } from '@ui/components/list';
import { INPUT_DATA } from '../constants';

@Component({
  selector: 'lib-wrapper-list',
  standalone: true,
  imports: [UiListItem, HeaderComponent, DatePipe, GetPositionTypePipe, GetStrategyNamePipe, TuiFormatNumberPipe, NgIf],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WrapperListComponent {
  @Input() list: any[] = INPUT_DATA;
}
