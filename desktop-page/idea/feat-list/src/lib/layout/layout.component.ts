import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { IDEA_CONSTANTS } from '@data-access-idea/constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterIdeaListComponent } from '../filter/filter.component';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import { TuiButton, TuiHint, TuiPopup, TuiTextfield } from '@taiga-ui/core';
import { TuiDrawer } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { UiList, UiListItem } from '@ui/components/list';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { ResponsePositions } from 'types/position';

interface FilterValue {
  type: AccountType;
  strategy: AccountStrategy;
  currency: AccountCurrency;
}

@Component({
  selector: 'idea-layout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiHint,
    TuiDrawer,
    TuiPopup,
    SearchDialogDirective,
    FilterIdeaListComponent,
    TuiTextfield,
    AsyncPipe,
    UiList,
    UiListItem,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #valueDefault = {
    search: '',
    type: FilterIdeaListComponent.valueDefaultType,
    strategy: FilterIdeaListComponent.valueDefaultStrategy,
    currency: FilterIdeaListComponent.valueDefaultCurrency,
  };

  protected readonly size = 's';
  protected readonly constants = IDEA_CONSTANTS;
  protected readonly filterControl: FormControl = new FormControl(this.#valueDefault);
  protected readonly searchControl: FormControl<string | null> = new FormControl('', { nonNullable: true });
  protected readonly openFilter: WritableSignal<boolean> = signal(false);

  readonly isActiveFilter$: Observable<boolean> = this.filterControl.valueChanges.pipe(
    startWith(this.filterControl.value),
    map(
      (value: FilterValue) =>
        value.currency.currencyId !== FilterIdeaListComponent.valueDefaultCurrency.currencyId ||
        value.strategy.id !== FilterIdeaListComponent.valueDefaultStrategy.id ||
        value.type.id !== FilterIdeaListComponent.valueDefaultType.id
    )
  );

  @Output() submitted = new EventEmitter<{
    search: string;
    type: AccountType;
    strategy: AccountStrategy;
    currency: AccountCurrency;
  }>();

  @Input() list: ResponsePositions | null = null;

  ngAfterViewInit(): void {
    this.submitted.emit(this.#valueDefault);
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    // this.formGroup.patchValue(this.templateValue);
  }

  onOpenDialog(event: StockInstrument | null): void {
    if (event) {
      this.#queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
        dialog: 'visible',
      });
    }
  }

  onReset(event: Event): void {
    event.preventDefault();

    this.filterControl.reset(this.#valueDefault);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.openFilter.set(false);
    this.submitted.emit(this.filterControl.value);
  }
}
