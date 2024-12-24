import { ChangeDetectionStrategy, Component, inject, Injector, Input } from '@angular/core';
import { AsyncPipe, DatePipe, JsonPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Position } from 'types/position';
import { IdeaService } from './idea.service';
import { IdeaEntry, IdeaStop, IdeaTarget, IdeaTotalTarget } from './idea.types';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { CheckComponent } from '@ui/components/check';
import { ItemLikeCheckboxDirective } from '@ui/components/list/item/item-like-checkbox.directive';
import { LoaderComponent } from '@ui/components/loader';
import { TargetAddComponent } from '../target/target-add.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { DIALOG, DialogService } from '@ui/components/dialog';

@Component({
  selector: 'lib-enter-idea',
  standalone: true,
  imports: [
    AsyncPipe,
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
    ItemLikeCheckboxDirective,
    LoaderComponent,
    NgTemplateOutlet,
    JsonPipe,
  ],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss',
  providers: [IdeaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent {
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _service: IdeaService = inject(IdeaService);

  private _dialogComponent: PolymorpheusComponent<TargetAddComponent> | null = null;

  readonly itemHeight = 28;
  priceIncrement = 2;
  inPositionQuantityValue = 0;
  entryAveragePrice = 0;

  @Input() edit = false;

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
      console.log(value, this.totalTarget);

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
      this.listTarget = this.listTarget.filter((item: { id: number | string }) => item.id !== data.id);
    }
  }

  async addTarget(event: Event): Promise<void> {
    event.preventDefault();

    this._dialogComponent = await import('../target/target-add.component')
      .then((m) => m.TargetAddComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._dialogService
      .open(this._dialogComponent, {
        appearance: 'dialog-block',
        data: {
          quantity: this.listEntry ? this.listEntry.reduce((acc, item) => acc + item.quantity, 0) : 0,
          target: (this.listTarget ? this.listTarget.length : 0) + 1,
        },
      })
      .subscribe((res) => console.log(res));
  }
}
