import { AsyncPipe, DatePipe, JsonPipe, NgForOf, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TUI_WINDOW_SIZE, TuiDialog } from '@taiga-ui/cdk';
import {
  TuiBreakpointService,
  TuiButtonModule,
  TuiLoaderModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { ChartComponent } from '@ui/chart';
import { Observable } from 'rxjs';
import { DESKTOP_STORE } from 'tokens/desktop';
import { Idea } from 'types/idea';
import { StockInstrument } from 'types/stock';
import { DesktopLkStore } from 'stores/desktop';
import { EnterActionComponent } from './action/action.component';
import { EnterIdeaComponent } from './idea/idea.component';
import { EnterSidebarComponent } from './sidebar/sidebar.component';
import { TuiTabsModule } from '@taiga-ui/kit';
import { map } from 'rxjs/operators';
import { InstrumentComponent } from './instrument/instrument.component';

@Component({
  selector: 'lib-enter',
  standalone: true,
  imports: [
    NgIf,
    JsonPipe,
    TuiLoaderModule,
    TuiButtonModule,
    EnterActionComponent,
    EnterIdeaComponent,
    EnterSidebarComponent,
    DatePipe,
    AsyncPipe,
    ChartComponent,
    TuiScrollbarModule,
    NgForOf,
    TuiTabsModule,
    TuiSvgModule,
    InstrumentComponent,
  ],
  templateUrl: './enter.component.html',
  styleUrl: './enter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VtEnterComponent {
  public readonly context: TuiDialog<any, Idea> = inject(POLYMORPHEUS_CONTEXT, {
    optional: true,
  });

  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  public readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  public readonly size$ = inject(TUI_WINDOW_SIZE).pipe(map(({ width, height }: ClientRect) => width < height));

  public readonly consolidationZones$: Observable<any | null> = this._store.consolidationZones$;

  public readonly candles$: Observable<any | null> = this._store.candles$;

  public readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  public readonly tabTabletList: { text: string; icon: string }[] = [
    {
      icon: 'tuiIconFileTextLarge',
      text: 'Инфо',
    },
    {
      icon: 'tuiIconChartLineLarge',
      text: 'График',
    },
    {
      icon: 'tuiIconShoppingCartLarge',
      text: 'Сделка',
    },
  ];

  public readonly tabMobileList: { text: string; icon: string }[] = [
    {
      icon: 'tuiIconFileTextLarge',
      text: 'Инфо',
    },
    {
      icon: 'tuiIconChartLineLarge',
      text: 'График',
    },
    {
      icon: 'tuiIconTargetLarge',
      text: 'Идея',
    },
    {
      icon: 'tuiIconShoppingCartLarge',
      text: 'Сдекла',
    },
  ];

  public readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.breakpoint$.pipe(
    map((screen: string | null): { text: string; icon: string }[] | null => {
      if (screen === 'mobile') {
        return this.tabMobileList;
      }

      if (screen === 'desktopSmall') {
        return this.tabTabletList;
      }

      this.activeItemIndex = 0;
      return null;
    })
  );

  activeItemIndex = 0;

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
