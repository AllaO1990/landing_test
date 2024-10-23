import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiAxesModule, TuiBarChartModule } from '@taiga-ui/addon-charts';
import { TuiContextWithImplicit, TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { tuiFormatNumber, TuiHintModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiInputDateRangeModule } from '@taiga-ui/kit';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'portfolio-profit',
  standalone: true,
  imports: [
    TuiAxesModule,
    TuiBarChartModule,
    TuiHintModule,
    TuiInputDateRangeModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
  ],
  templateUrl: './profit.component.html',
  styleUrl: './profit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfitComponent {
  readonly value = [[3660, 8281, 1069, 9034, 5797, 6918, 8495, 3234, 6204, 1392, 2088, 8637, 8779]];

  readonly labelsX = ['Jan 2019', 'Feb', 'Mar'];
  readonly labelsY = ['0', '10 000'];

  readonly controlRange: FormControl<TuiDayRange> = new FormControl(
    new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)),
    { nonNullable: true }
  );

  readonly hint = ({ $implicit }: TuiContextWithImplicit<number>): string =>
    this.value.reduce((result, set) => `${result} ${tuiFormatNumber(set[$implicit])}\n`, '').trim();
}
