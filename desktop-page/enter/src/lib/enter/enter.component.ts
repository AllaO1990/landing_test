import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  TuiButtonModule,
  TuiLoaderModule,
  TuiScrollbarModule,
} from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialog } from '@taiga-ui/cdk';
import { EnterActionComponent } from './action/action.component';
import { EnterIdeaComponent } from './idea/idea.component';
import { AsyncPipe, DatePipe, JsonPipe, NgIf } from '@angular/common';
import { EnterSidebarComponent } from './sidebar/sidebar.component';
import { Idea } from 'types/idea';
import { ChartComponent } from '@ui/chart';
import { DesktopLkStore } from '../../../../../stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';

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

  public readonly consolidationZones$: Observable<any | null> =
    this._store.consolidationZones$;

  public readonly candles$: Observable<any | null> = this._store.candles$;

  public readonly selected$: Observable<StockInstrument | null> =
    this._store.selectedInstrument$;

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }
}
