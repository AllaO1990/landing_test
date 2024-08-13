import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiAutoFocusModule, TuiDialog } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiInputModule } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiBreakpointService, TuiButtonModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { debounceTime, Observable, switchMap } from 'rxjs';
import { StockInstrument, StockListItems } from 'types/stock';
import { filter, map, startWith } from 'rxjs/operators';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/list';
import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';

@Component({
  selector: 'vt-search-card',
  standalone: true,
  imports: [
    TuiInputModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    NgIf,
    NgFor,
    AsyncPipe,
    ListComponent,
    ItemDirective,
    HeaderComponent,
    TuiAutoFocusModule,
    TuiButtonModule,
  ],
  templateUrl: './search-card.component.html',
  styleUrl: './search-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchCardComponent {
  public readonly _breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly context: TuiDialog<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly form: FormGroup = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true }),
  });

  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile')
  );

  get controlSearch(): FormControl {
    return this.form.get('search') as FormControl;
  }

  readonly list$: Observable<StockListItems | null> = this._store.stock$.pipe(
    switchMap((stock: StockListItems | null) =>
      this.controlSearch.valueChanges.pipe(
        debounceTime(300),
        filter((value: string) => value.length > 1 || value.length === 0),
        startWith(this.controlSearch.value),
        map((value: string) => value.trim().toLowerCase()),
        map((value: string) => this._searched(stock, value))
      )
    )
  );

  private _searched(list: StockListItems | null, value: string): StockListItems | null {
    if (list === null) {
      return null;
    }

    if (!value || value.length === 0) {
      return list;
    }

    return list.filter((item: StockInstrument) => {
      const concat = [item.ticker, item.name].map((item: string) => item.toLowerCase()).join('⁂');

      return concat.indexOf(value) !== -1;
    });
  }

  onClick(event: Event, value: StockInstrument): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.STOCK_LIST,
      id: value.id,
    });

    this.context.$implicit.complete();
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }
}
