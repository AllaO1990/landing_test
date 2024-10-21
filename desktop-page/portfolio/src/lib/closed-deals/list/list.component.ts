import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { GetPositionTypePipe } from '@ui/pipes/get-posiotion-type.pipe';
import { GetStrategyNamePipe } from '@ui/pipes/get-strategy-name.pipe';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiFormatNumberPipeModule } from '@taiga-ui/core';
import { INPUT_DATA } from '../constants';

@Component({
  selector: 'lib-wrapper-list',
  standalone: true,
  imports: [
    ListComponent,
    ItemDirective,
    HeaderComponent,
    DatePipe,
    GetPositionTypePipe,
    GetStrategyNamePipe,
    TuiFormatNumberPipeModule,
    NgIf,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WrapperListComponent {
  @Input() list: any[] = INPUT_DATA;
}
