import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiInputModule, TuiSelectModule } from '@taiga-ui/kit';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiSvgModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiAutoFocusModule, TuiStringHandler } from '@taiga-ui/cdk';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { StockListComponent } from './list/list.component';
import { filter, map } from 'rxjs/operators';
import {
  StockList,
  StockListItemPrice,
  StockName,
  StockNameType,
  StockPrice,
} from 'types/stock';
import { DESKTOP_STORE } from 'tokens/desktop';
import { DesktopLkStore } from '../../../../../../stores/desktop';
import { StockService } from './stock.service';

@Component({
  selector: 'vt-stock',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListModule,
    NgIf,
    TuiSvgModule,
    AsyncPipe,
    NgForOf,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiButtonModule,
    StockListComponent,
  ],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  providers: [StockService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockComponent {
  private _map: Map<StockName, StockList> | null = null;

  private readonly _service: StockService = inject(StockService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  private readonly _nameList$: Subject<StockName[]> = new BehaviorSubject<
    StockName[]
  >([]);

  public listStockName: StockName[] = [
    {
      id: 'moex',
      name: 'Акции Московской биржи',
      type: StockNameType.DEFAULT,
    },
    {
      id: 'futures',
      name: 'Фьючерсы Московской биржи',
      type: StockNameType.DEFAULT,
    },
    {
      id: 'currency',
      name: 'Валюта Московской биржи',
      type: StockNameType.DEFAULT,
    },
    {
      id: 'metal',
      name: 'Металлы Московской биржи',
      type: StockNameType.DEFAULT,
    },
  ];

  public readonly controlName: FormControl<StockName | null> =
    new FormControl<StockName | null>(null);

  public readonly controlListName: FormControl<string | null> = new FormControl<
    string | null
  >(null);

  // @Output() selected = new EventEmmiter();

  @Input() set data(value: StockList | null) {
    if (value) {
      const {
        list,
        stock,
      }: { list: StockName[]; stock: Map<StockName, StockList> } =
        this._service.getListName(value, this.listStockName);
      this._map = stock;

      this.listStockName = list;
      this._nameList$.next(list);
      this.controlName.patchValue(list[0]);
    }
  }

  @Input() price: StockPrice<StockListItemPrice> | null = null;

  public readonly stringify: TuiStringHandler<StockName> = (item: StockName) =>
    item.name;

  public readonly nameList$: Observable<StockName[]> =
    this._nameList$.asObservable();

  public readonly list$: Observable<StockList> =
    this.controlName.valueChanges.pipe(
      filter((value: StockName | null): value is StockName => !!value),
      map((value: StockName) => this._map!.get(value)!),
      tap((list: StockList) => this._store.updateActive(list))
    );

  signatureVisible: boolean = false;

  public toggle(): void {
    this.signatureVisible = !this.signatureVisible;
  }

  public addList(event: Event): void {
    event.preventDefault();

    this._create();
    this.toggle();
  }

  public trackByStockNameItem(_: number, item: StockName): number | string {
    return item.id;
  }

  public onSelect(event: { type: string; value: unknown }): void {
    this._store.updateSelect(event);
  }

  private _create(): void {
    const stockName: StockName = {
      id: new Date().toISOString(),
      name: this.controlListName.value as string,
      type: StockNameType.CUSTOM,
    };

    this.listStockName.push(stockName);
    this._nameList$.next(this.listStockName);

    if (this._map) {
      this._map.set(stockName, []);
    }

    this.controlName.patchValue(stockName);
    this.controlListName.reset();
  }
}
