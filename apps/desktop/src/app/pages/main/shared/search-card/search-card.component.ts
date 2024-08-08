import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiDialog } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiInputModule } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiTextfieldControllerModule } from '@taiga-ui/core';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { debounceTime, Observable, switchMap } from 'rxjs';
import { StockInstrument, StockList } from 'types/stock';
import { filter, map, startWith } from 'rxjs/operators';
import { AsyncPipe, NgFor } from '@angular/common';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/list';
import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';

@Component({
  selector: 'vt-search-card',
  standalone: true,
  imports: [
    TuiInputModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    NgFor,
    AsyncPipe,
    ListComponent,
    ItemDirective,
    HeaderComponent,
  ],
  templateUrl: './search-card.component.html',
  styleUrl: './search-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchCardComponent {
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly context: TuiDialog<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly form: FormGroup = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true }),
  });

  get controlSearch(): FormControl {
    return this.form.get('search') as FormControl;
  }

  readonly list$: Observable<StockList | null> = this._store.stock$.pipe(
    switchMap((stock: StockList | null) =>
      this.controlSearch.valueChanges.pipe(
        debounceTime(300),
        filter((value: string) => value.length > 1 || value.length === 0),
        startWith(this.controlSearch.value),
        map((value: string) => value.trim().toLowerCase()),
        map((value: string) => this._searched(stock, value))
      )
    )
  );

  private _searched(list: StockList | null, value: string): StockList | null {
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
}
