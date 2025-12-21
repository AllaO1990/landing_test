import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { ChartCandlestickButtonDirective } from './toolbar.directive';

@Component({
  selector: 'light-toolbar',
  imports: [TuiButton, ChartCandlestickButtonDirective],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  protected readonly size = 's';
  protected readonly constants = PORTFOLIO_CONSTANTS;
}
