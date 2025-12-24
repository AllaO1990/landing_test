import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { ChartCandlestickButtonDirective } from './toolbar.directive';
import { LocalStorage } from 'storage/local.storage';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';

@Component({
  selector: 'light-toolbar',
  imports: [TuiButton, ChartCandlestickButtonDirective],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements AfterViewInit {
  readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);

  protected readonly size = 's';
  protected readonly constants = PORTFOLIO_CONSTANTS;

  ngAfterViewInit(): void {
    this.#localStorage.setItem('mode', 'light');
  }
}
