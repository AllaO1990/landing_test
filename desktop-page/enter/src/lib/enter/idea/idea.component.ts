import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { DatePipe, JsonPipe, NgIf } from '@angular/common';
import { TUI_NUMBER_FORMAT, TuiButtonModule, TuiFormatNumberPipeModule, TuiSvgModule } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StockId } from 'types/stock';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/list';
import { CheckComponent } from '@ui/check';
import { Position } from 'types/position';
import { IdeaService } from './idea.service';
import { IdeaEntry, IdeaTarget, IdeaTotalTarget } from './idea.types';

@Component({
  selector: 'lib-enter-idea',
  standalone: true,
  imports: [
    JsonPipe,
    ItemComponent,
    ItemDirective,
    HeaderComponent,
    TuiButtonModule,
    DatePipe,
    ReactiveFormsModule,
    NgIf,
    TuiSvgModule,
    CheckComponent,
    TuiFormatNumberPipeModule,
    ListComponent,
    ItemComponent,
    HeaderComponent,
    ItemDirective,
    CheckComponent,
  ],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss',
  providers: [
    IdeaService,
    {
      provide: TUI_NUMBER_FORMAT,
      useValue: {
        zeroPadding: false,
        decimalLimit: 2,
      },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent {
  private readonly _service: IdeaService = inject(IdeaService);
  public readonly itemHeight = 28;
  public priceIncrement = 2;

  @Input()
  set data(value: Position | null) {
    if (value) {
      this.priceIncrement = value.priceIncrement;

      this.listEntry = this._service.getListEntry(value.entries);
      this.listTarget = this._service.getListTarget(
        value.targets,
        value.entryAveragePrice,
        value.fullPositionQuantityValue,
        value.multiplier
      );

      this.totalTarget = this._service.getTotalTarget(this.listTarget, value.fullPositionPrice);

      this.listStop = [
        {
          id: '0',
          ...value.stop,
          amount: value.fullPositionQuantityValue,
          amountPercent: 1,
          loss: (value.fullPositionQuantityValue * value.stop.price - value.fullPositionPrice) * value.multiplier,
          checked: false,
          date: '',
        },
      ];

      this.formEntry = new FormGroup(this._getControlFromList(this.listEntry));
      this.formTarget = new FormGroup(this._getControlFromList(this.listTarget));
      this.formStop = new FormGroup(this._getControlFromList(this.listStop));
    }
  }

  listEntry: IdeaEntry[] = [];

  formEntry = new FormGroup(this._getControlFromList(this.listEntry));

  listTarget: IdeaTarget[] = [];

  totalTarget: null | IdeaTotalTarget = null;

  formTarget = new FormGroup(this._getControlFromList(this.listTarget));

  listStop: any[] = [];

  formStop = new FormGroup(this._getControlFromList(this.listStop));

  onRemove(event: Event, data: { id: StockId }): void {
    event.preventDefault();

    this.listTarget = this.listTarget.filter((item: { id: StockId }) => item.id !== data.id);
  }

  private _getControlFromList(list: { id: StockId; checked: boolean }[]): {
    [key: string]: FormControl<boolean>;
  } {
    return list.reduce((acc: { [key: string]: FormControl<boolean> }, item: { id: StockId; checked: boolean }) => {
      acc[item.id] = new FormControl<boolean>(
        { value: item.checked, disabled: true },
        {
          nonNullable: true,
        }
      );

      return acc;
    }, {});
  }
}
