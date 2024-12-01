import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Idea } from 'types/idea';
import { StockInstrument } from 'types/stock';
import { MainService } from './main.service';
import { TuiBreakpointService } from '@taiga-ui/core';
import { Position } from 'types/position';
// import { ChartCandlestickComponent, TabsComponent } from 'ui-common';
import { MAIN_TAB_MOBILE_LIST, MAIN_TAB_TABLET_LIST } from './main.constants';
import { SelectFacade } from 'stores/facades/select.facade';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { PositionFacade } from 'stores/facades/position.facade';
import { TabsComponent } from 'ui-common/lib/tabs';
import { OutComponent } from './out/out.component';
import { StockComponent } from './stock/stock.component';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    TabsComponent,
    OutComponent,
    StockComponent,
    // StockComponent,
    // EntryModule,
    // TabsComponent,
    // EntryModule,
    // OutModule,
    // StockComponent,
    // ChartCandlestickComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  activeItemIndex = 0;

  private readonly _service: MainService = inject(MainService);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _position: PositionFacade = inject(PositionFacade);

  readonly tabMobileList = MAIN_TAB_MOBILE_LIST;
  readonly tabTabletList = MAIN_TAB_TABLET_LIST;

  public readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  public readonly selected$: Observable<StockInstrument | null> = this._select.instrument$;

  public readonly ideaList$: Observable<Idea[] | null> = this._idea.list$.pipe(
    map((list: Idea[] | null) => list && this._service.sortIdeaList(list))
  );

  public readonly selectedIdea$: Observable<any> = this._idea.select$;

  public readonly positionList$: Observable<Position[] | null> = this._position.list$;

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
