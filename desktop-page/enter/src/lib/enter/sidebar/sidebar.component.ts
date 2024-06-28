import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  TuiButtonModule,
  TuiSvgModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { Idea } from 'types/idea';
import { JsonPipe, NgIf } from '@angular/common';
import { InstrumentComponent } from './instrument/instrument.component';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiFilterModule, TuiTextareaModule } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { STOCK_TIMING_LIST } from 'constants/stock-timing';

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
  public readonly strategy: { id: string; name: string }[] =
    STOCK_STRATEGY_LIST;

  public readonly positionType: { id: string; name: string }[] =
    STOCK_POSITION_TYPE_LIST;

  public readonly timing: { id: string; name: string }[] = STOCK_TIMING_LIST;

  public readonly constants = SIDEBAR_CONSTANTS;

  public controlFilterStrategy: FormControl<{
    id: string;
    name: string;
  } | null> = new FormControl(null);

  public controlTextArea = new FormControl(null);

  @Input() data: Idea | null = null;
}
