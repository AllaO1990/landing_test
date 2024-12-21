import { TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { Idea } from 'types/idea';
import { AsyncPipe, NgIf } from '@angular/common';
import { InstrumentComponent } from '../instrument/instrument.component';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiFilter } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { STOCK_TIMING_LIST } from 'constants/stock-timing';
import { TuiBooleanHandler, TuiIdentityMatcher } from '@taiga-ui/cdk';
import { Position } from 'types/position';

type Item = { id: string; name: string };

@Component({
  selector: 'lib-enter-sidebar',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    InstrumentComponent,
    ValidDateComponent,
    AsyncPipe,
    TuiFilter,
    TuiButton,
    TuiIcon,
    TuiTextareaModule,
    TuiScrollbar,
    TuiFormatNumberPipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent {
  private _data: Idea | Position | null = null;

  public readonly strategy: Item[] = STOCK_STRATEGY_LIST;

  public readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;

  public readonly timing: Item[] = STOCK_TIMING_LIST;

  public readonly constants = SIDEBAR_CONSTANTS;

  form: FormGroup = new FormGroup({
    date: new FormControl({ value: null, disabled: true }),
    timing: new FormControl({ value: null, disabled: true }),
    strategy: new FormControl({ value: null, disabled: true }),
    type: new FormControl({ value: null, disabled: true }),
    area: new FormControl({ value: null, disabled: true }),
  });

  controlDate = new FormControl({ value: null, disabled: true });

  public controlFilterTiming: FormControl<Item[] | null> = new FormControl(null);

  public controlFilterStrategy: FormControl<Item[] | null> = new FormControl(null);

  public readonly controlFilterPositionType: FormControl<Item[] | null> = new FormControl(null);

  public controlTextArea = new FormControl(null);

  @Input() edit = false;

  @Input()
  set data(value: Idea | Position | null) {
    this._data = value;

    if (value) {
      this.controlFilterTiming.disable();
      this.controlFilterTiming.patchValue([this.timing[1]]);
      this.controlFilterStrategy.patchValue(
        this.strategy.filter((item: { id: string }) => item.id === (value.strategy && value.strategy.type)) || null
      );
      this.controlFilterPositionType.patchValue(
        this.positionType.filter((item: { id: string }) => item.id === value.positionType) || null
      );
    }
  }

  get data() {
    return this._data;
  }

  identityMatcher: TuiIdentityMatcher<{ id: string }> = (value: { id: string }, item: { id: string }): boolean => {
    return value.id === item.id;
  };

  disabledItemHandler: TuiBooleanHandler<{ id: string }> = () => !this.edit;
}
