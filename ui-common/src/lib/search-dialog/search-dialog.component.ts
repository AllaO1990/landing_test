import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiAutoFocus, TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiBreakpointService, TuiButton } from '@taiga-ui/core';
import { debounceTime, Observable, switchMap } from 'rxjs';
import { StockInstrument, StockListItems } from 'types/stock';
import { filter, map, startWith } from 'rxjs/operators';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { StockListFacade } from 'stores/facades/stock-list.facade';

@Component({
  selector: 'lib-search-dialog',
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
    TuiAutoFocus,
    TuiButton,
  ],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent {
  public readonly _breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
  private readonly _store: StockListFacade = inject(StockListFacade);

  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly form: FormGroup = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true }),
  });

  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile')
  );

  get controlSearch(): FormControl {
    return this.form.get('search') as FormControl;
  }

  readonly list$: Observable<StockListItems | null> = this._store.listInstrument$.pipe(
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

    this.context.completeWith(value);
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.completeWith(null);
  }
}
