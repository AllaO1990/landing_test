import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WrapperTableComponent } from './table/table.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { OUT_CONSTANTS } from '../../../../main/src/lib/main/out/out.constants';
import { StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiDataListWrapperComponent } from '@taiga-ui/kit';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { filter, Observable, of, shareReplay, tap } from 'rxjs';
import { map } from 'rxjs/operators';

type ListItem = { value: string; id: string | null };

@Component({
  selector: 'portfolio-closed-deals',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    WrapperTableComponent,
    SearchDialogDirective,
    TuiButton,
    TuiTextfield,
    AsyncPipe,
    NgIf,
    TuiDataListWrapperComponent,
    TuiSelectModule,
    TuiTextfieldControllerModule,
  ],
  templateUrl: './closed-deals.component.html',
  styleUrl: './closed-deals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  protected readonly constants = OUT_CONSTANTS;
  readonly size = 's';
  readonly formControl: FormControl = new FormControl(null);
  readonly controlSearch: FormControl = new FormControl(null);
  readonly controlTransaction: FormControl = new FormControl(null);

  readonly transaction$: Observable<ListItem[]> = of([
    { value: 'Открытые', id: '1' },
    { value: 'Закрытые', id: '2' },
  ]).pipe(
    filter((list: ListItem[] | null): list is ListItem[] => list !== null),
    map((list: ListItem[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: ListItem[]) => {
      if (list !== null && list.length > 0 && this.controlTransaction.value === null) {
        this.controlTransaction.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  onOpenDialog(event: StockInstrument | null): void {
    if (event) {
      this.#queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
        dialog: 'visible',
      });
    }
  }
}
