import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '../list';
import { DatePipe, NgIf } from '@angular/common';
import { TuiButtonModule, TuiFormatNumberPipeModule, TuiScrollbarModule } from '@taiga-ui/core';
import { Position } from 'types/position';
import { ActionService } from './action.service';
import {
  ActionEntryItem,
  ActionOutItem,
  ActionRemainder,
  ActionResult,
  ActionTotalEntry,
  ActionTotalOut,
} from './action.types';

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [
    NgIf,
    ListComponent,
    ItemComponent,
    ItemDirective,
    DatePipe,
    HeaderComponent,
    TuiButtonModule,
    TuiFormatNumberPipeModule,
    TuiScrollbarModule,
  ],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  providers: [ActionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent {
  private readonly _service: ActionService = inject(ActionService);

  priceIncrement = 0;

  @Input()
  set data(value: Position) {
    if (value) {
      this.priceIncrement = value.priceIncrement;

      this.listEntry = this._service.getListEntry(value.entries);
      this.totalEntry = this._service.getTotalEntry(this.listEntry);
      this.listOut = this._service.getListOut(value.targets, value.entryAveragePrice, value.multiplier);
      this.totalOut = this._service.getTotalOut(this.listOut, value.entryAveragePrice, value.multiplier);
      this.remainder = this._service.getRemainder(
        value.targets,
        value.entryAveragePrice,
        value.lastPrice,
        value.multiplier
      );
      this.result = this._service.getResult(this.totalOut, this.remainder, value.entryAveragePrice, value.multiplier);
    }
  }

  listEntry: ActionEntryItem[] = [];
  totalEntry: ActionTotalEntry | null = null;
  listOut: ActionOutItem[] = [];
  totalOut: ActionTotalOut | null = null;
  remainder: ActionRemainder | null = null;
  result: ActionResult | null = null;
}
