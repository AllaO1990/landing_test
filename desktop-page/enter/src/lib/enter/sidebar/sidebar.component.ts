import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButtonModule, TuiSvgModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { Idea } from 'types/idea';
import { JsonPipe, NgIf } from '@angular/common';
import { InstrumentComponent } from './instrument/instrument.component';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiFilterModule, TuiTextareaModule } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { STOCK_TIMING_LIST } from 'constants/stock-timing';
import { TuiBooleanHandler, TuiIdentityMatcher } from '@taiga-ui/cdk';

@Component({
  selector: 'lib-enter-sidebar',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    InstrumentComponent,
    ValidDateComponent,
    JsonPipe,
    TuiFilterModule,
    TuiButtonModule,
    TuiSvgModule,
    TuiTextareaModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent {
  private _data: Idea | null = null;

  public readonly strategy: { id: string; name: string }[] = STOCK_STRATEGY_LIST;

  public readonly positionType: { id: string; name: string }[] = STOCK_POSITION_TYPE_LIST;

  public readonly timing: { id: string; name: string }[] = STOCK_TIMING_LIST;

  public readonly constants = SIDEBAR_CONSTANTS;

  public controlFilterTiming: FormControl<
    | {
        id: string;
        name: string;
      }[]
    | null
  > = new FormControl(null);

  public controlFilterStrategy: FormControl<
    | {
        id: string;
        name: string;
      }[]
    | null
  > = new FormControl(null);

  public readonly controlFilterPositionType: FormControl<
    | {
        id: string;
        name: string;
      }[]
    | null
  > = new FormControl(null);

  public controlTextArea = new FormControl(null);

  @Input()
  set data(value: Idea | null) {
    this._data = value;

    if (value) {
      this.controlFilterTiming.disable();
      this.controlFilterTiming.patchValue([this.timing[1]]);
      this.controlFilterStrategy.patchValue(
        this.strategy.filter((item: { id: string }) => item.id === value.strategy.type) || null
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

  disabledItemHandler: TuiBooleanHandler<{ id: string }> = () => true;
}
