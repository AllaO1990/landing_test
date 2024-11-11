import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { TUI_NUMBER_FORMAT, TuiFormatNumberPipe, TuiLoader, TuiScrollbar, TuiButton } from '@taiga-ui/core';
import { Position } from 'types/position';
import { ActionService } from './action.service';
import {
  ActionEntry,
  ActionOut,
  ActionRemainder,
  ActionResult,
  ActionTotalEntry,
  ActionTotalOut,
} from './action.types';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/components/list';

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [
    NgIf,
    ItemComponent,
    DatePipe,
    HeaderComponent,
    TuiButton,
    TuiFormatNumberPipe,
    TuiScrollbar,
    ListComponent,
    ItemDirective,
    TuiLoader,
  ],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  providers: [
    ActionService,
    {
      provide: TUI_NUMBER_FORMAT,
      useValue: {
        zeroPadding: false,
        decimalLimit: 2,
        decimalSeparator: '.',
      },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent {
  private readonly _service: ActionService = inject(ActionService);

  priceIncrement = 0;

  @Input()
  set data(value: Position) {
    if (value) {
      this.priceIncrement = value.priceIncrement;

      this.listEntry = this._service.getActionEntry(value);
      this.totalEntry = this._service.getActionTotalEntry(this.listEntry);

      this.listOut = this._service.getActionOut(value);
      this.totalOut = this._service.getActionTotalOut(this.listOut, value.entryAveragePrice, value.multiplier);

      this.remainder = this._service.getRemainder(value);
      this.result = this._service.getResult(this.totalOut, this.remainder, value);
    }
  }

  listEntry: ActionEntry[] | null = null;
  totalEntry: ActionTotalEntry | null = null;
  listOut: ActionOut[] | null = null;
  totalOut: ActionTotalOut | null = null;
  remainder: ActionRemainder | null = null;
  result: ActionResult | null = null;
}
