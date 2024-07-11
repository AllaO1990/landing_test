import { AsyncPipe, DatePipe, JsonPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiDialog } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLoaderModule, TuiScrollbarModule } from '@taiga-ui/core';
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

  public readonly consolidationZones$: Observable<any | null> = this._store.consolidationZones$;

  public readonly candles$: Observable<any | null> = this._store.candles$;

  public readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }
}
