import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { DatePipe, JsonPipe, NgIf } from '@angular/common';
import { TUI_NUMBER_FORMAT, TuiFormatNumberPipe, TuiLoader, TuiIcon, TuiButton } from '@taiga-ui/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Position } from 'types/position';
import { IdeaService } from './idea.service';
import { IdeaEntry, IdeaStop, IdeaTarget, IdeaTotalTarget } from './idea.types';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { CheckComponent } from '@ui/components/check';

@Component({
  selector: 'lib-enter-idea',
  standalone: true,
  imports: [
    JsonPipe,
    ItemComponent,
    ItemDirective,
    HeaderComponent,
    TuiButton,
    DatePipe,
    ReactiveFormsModule,
    NgIf,
    TuiIcon,
    CheckComponent,
    TuiFormatNumberPipe,
    ListComponent,
    TuiLoader,
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
  readonly itemHeight = 28;
  priceIncrement = 2;
  inPositionQuantityValue = 0;
  entryAveragePrice = 0;

  @Input()
  set data(value: Position | null) {
    if (value) {
      this.priceIncrement = value.priceIncrement;
      this.inPositionQuantityValue = value.inPositionQuantityValue;
      this.entryAveragePrice = value.entryAveragePrice;

      this.listEntry = this._service.getIdeaEntries(value);
      this.listTarget = this._service.getIdeaTargets(value);
      this.listStop = this._service.getIdeaStops(value);
      this.totalTarget = this._service.getTotalTarget(this.listTarget, value.inPositionPrice);

      this.formEntry = new FormGroup(this._service.getControlFromList(this.listEntry));
      this.formTarget = new FormGroup(this._service.getControlFromList(this.listTarget));
      this.formStop = new FormGroup(this._service.getControlFromList(this.listStop));
    }
  }

  listEntry: IdeaEntry[] | null = null;

  formEntry = new FormGroup({});

  listTarget: IdeaTarget[] | null = null;

  totalTarget: null | IdeaTotalTarget = null;

  formTarget = new FormGroup({});

  listStop: IdeaStop[] | null = null;

  formStop = new FormGroup({});

  onRemove(event: Event, data: { id: number }): void {
    event.preventDefault();

    if (this.listTarget) {
      this.listTarget = this.listTarget.filter((item: { id: number }) => item.id !== data.id);
    }
  }
}
