import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiCheckbox } from '@taiga-ui/kit';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiIcon } from '@taiga-ui/core';
import { TradeDialogService } from '../dialog/dialog.service';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { FilterComponent } from '../filter/filter.component';
import { ApiService } from '../common/api.service';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { filter, map, Observable, startWith } from 'rxjs';
import { StockPosition } from 'types/position';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeSource } from '../common/api.types';
import { TradeStore } from '../common/store';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [
    ListComponent,
    HeaderComponent,
    ItemDirective,
    TuiCheckbox,
    ReactiveFormsModule,
    TuiButton,
    NgTemplateOutlet,
    TuiIcon,
    NgIf,
    AsyncPipe,
    TuiFormatNumberPipe,
    FilterComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  providers: [
    ApiService,
    {
      provide: TradeStore,
      useFactory: (api: ApiService) => new TradeStore(api),
      deps: [ApiService],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeLayoutComponent implements AfterViewInit {
  readonly #injector: Injector = inject(Injector);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #service: TradeDialogService = inject(TradeDialogService);
  readonly #idea: IdeaFacade = inject(IdeaFacade);
  readonly #api: ApiService = inject(ApiService);
  readonly #store: TradeStore = inject(TradeStore);

  readonly controlFilter = new FormControl<any>(null);
  readonly controlAuto: FormControl<boolean> = new FormControl(true, { nonNullable: true });
  readonly itemHeight = 28;

  readonly idea$: Observable<StockPosition> = this.#idea.idea$;
  readonly sourceId$: Observable<number> = this.controlFilter.valueChanges.pipe(
    startWith(this.controlFilter.value),
    map((value: null | { source: null | TradeSource }): null | number => {
      if (value !== null && value.source !== null) {
        return value.source.id;
      }

      return null;
    }),
    filter((value: null | number): value is number => value !== null)
  );

  listEntry = [
    {
      id: '1',
      type: { name: 'Лимитная цена', id: '1' },
      price: 1.54,
      amount: 4000,
      commission: 4.58,
      total: 6165,
      broker: 'Тинькофф',
      action: { name: 'Продать', id: '2' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
    {
      id: '2',
      type: { name: 'Лучшая цена', id: '2' },
      price: 1.55,
      amount: 1000,
      commission: 5,
      total: 1555,
      broker: 'Тинькофф',
      action: { name: 'Продать', id: '2' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
  ];

  listOut = [
    {
      id: '3',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.5,
      amount: 2000,
      commission: 10,
      total: 3010,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'ИСПОЛНЕНО', id: '1' },
    },
    {
      id: '4',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.46,
      amount: 1000,
      commission: null,
      total: 1460,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
    {
      id: '5',
      type: { name: 'Тейк-профит', id: '4' },
      price: 1.37,
      amount: 1000,
      commission: null,
      total: 1370,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
    {
      id: '6',
      type: { name: 'Стоп-лосс', id: '5' },
      price: 1.61,
      amount: 4000,
      commission: null,
      total: 6440,
      broker: 'Тинькофф',
      action: { name: 'Купить', id: '1' },
      status: { name: 'АКТИВНА', id: '2' },
    },
  ];

  ngAfterViewInit(): void {
    this.#store.loadSources();

    this.idea$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((position: StockPosition) =>
      this.controlFilter.patchValue({
        instrument: position.idea.instrument,
      })
    );

    this.controlFilter.valueChanges
      .pipe(startWith(this.controlFilter.value))
      .subscribe((filter) => console.log(filter));

    // this.sourceId$
    //   .pipe(switchMap((sourceId: number) => this.#api.getAccounts(sourceId)))
    //   .subscribe((value: any) => console.log(value));
    //
    // this.sourceId$
    //   .pipe(switchMap((sourceId: number) => this.#api.getToken(sourceId)))
    //   .subscribe((value: any) => console.log(value));
  }

  open(event: Event, list: string, data: any = null) {
    event.preventDefault();

    this.#service.openTradeRequest(this.#injector, data).subscribe((value) => {
      if (value) {
        if (list === 'out') {
          this.listOut = this.listOut.map((item) => {
            if (item.id === data.id) {
              return { ...item, price: value.price, amount: value.amount };
            }

            return item;
          });
        } else {
          this.listEntry = this.listEntry.map((item) => {
            if (item.id === data.id) {
              return { ...item, price: value.price, amount: value.amount };
            }

            return item;
          });
        }
      }
    });
  }

  remove(event: Event, list: string, data: any): void {
    event.preventDefault();

    if (list === 'out') {
      this.listOut = this.listOut.filter((item) => item.id !== data.id);
    } else {
      this.listEntry = this.listEntry.filter((item) => item.id !== data.id);
    }
  }
}
