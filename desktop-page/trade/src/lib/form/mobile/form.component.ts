import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { HeaderComponent, UiList, UiListItem } from '@ui/components/list';
import { TuiButtonLoading, TuiCheckbox, TuiChevron } from '@taiga-ui/kit';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { TuiExpand } from '@taiga-ui/experimental';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { FilterComponent } from '../../filter/filter.component';
import { DirectionTypePipe } from '../../common/direction-type.pipe';
import { OrderTypePipe } from '../../common/order-type.pipe';
import { TuiItem } from '@taiga-ui/cdk';
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { DetailsComponent } from '../../details/details.component';
import { TradeFormComponent } from '../form.component';
import { TradeFormDialogService } from '../form.dialog.service';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { TradeFormService } from '../form.service';
import { ClosePositionComponent } from '../../close-position/close-position.component';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { ControlValue } from '../form.types';

@Component({
  selector: 'trade-mobile-form',
  standalone: true,
  imports: [
    UiList,
    HeaderComponent,
    UiListItem,
    TuiCheckbox,
    ReactiveFormsModule,
    TuiButton,
    NgTemplateOutlet,
    TuiIcon,
    AsyncPipe,
    TuiFormatNumberPipe,
    FilterComponent,
    TuiScrollbar,
    DirectionTypePipe,
    OrderTypePipe,
    TuiButtonLoading,
    TuiHint,
    TuiExpand,
    TuiChevron,
    TuiItem,
    DetailsComponent,
    DatePipe,
    ClosePositionComponent,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  animations: [triggerHeightAnimations],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TradeMobileFormComponent),
      multi: true,
    },
    {
      provide: TradeFormDialogService,
      useFactory: (dialog: DialogService) => new TradeFormDialogService(dialog),
      deps: [DIALOG],
    },
    TradeFormService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeMobileFormComponent extends TradeFormComponent {
  readonly mobileHeightEntry$: Observable<number> = this.listEntry$.pipe(
    map((list: ControlValue[]) => {
      const length = (list && list.length) || 0;

      return (length > 3 ? 3 : length) * 52;
    }),
    distinctUntilChanged()
  );

  readonly mobileHeightOut$: Observable<number> = this.listOut$.pipe(
    map((list: ControlValue[]) => {
      const length = (list && list.length) || 0;

      return (length > 4 ? 4 : length) * 52;
    }),
    distinctUntilChanged()
  );

  readonly mobileHeightStop$: Observable<number> = this.listStop$.pipe(
    map((list: ControlValue[]) => {
      const length = (list && list.length) || 0;

      return (length > 4 ? 4 : length) * 52;
    }),
    distinctUntilChanged()
  );
}
