import { TuiTabs } from '@taiga-ui/kit';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { Idea } from 'types/idea';
import { StockInstrument } from 'types/stock';
import { MainService } from './main.service';
import { TuiBreakpointService, TuiIcon } from '@taiga-ui/core';
import { Position } from 'types/position';
import { ChartCandlestickComponent, TabsComponent } from 'ui-common';
import { StockComponent } from './stock/stock.component';
import { EntryModule } from './entry/entry.module';
import { OutModule } from './out/out.module';
import { MAIN_TAB_MOBILE_LIST, MAIN_TAB_TABLET_LIST } from './main.constants';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    TuiTabs,
    TuiIcon,
    TabsComponent,
    EntryModule,
    OutModule,
    StockComponent,
    ChartCandlestickComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  activeItemIndex = 0;

  private readonly _service: MainService = inject(MainService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  readonly tabMobileList = MAIN_TAB_MOBILE_LIST;
  readonly tabTabletList = MAIN_TAB_TABLET_LIST;

  public readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  public readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;

  public readonly ideaList$: Observable<Idea[] | null> = this._store.entry$.pipe(
    map((list: Idea[] | null) => list && this._service.sortIdeaList(list))
  );

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  public readonly positionList$: Observable<Position[] | null> = this._store.position$;

  readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.breakpoint$.pipe(
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
}
