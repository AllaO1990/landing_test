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
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  switchMap,
} from 'rxjs';
import { StockListItem, StockNameItem } from './stock.types';
import { StockListComponent } from './list/list.component';
import { DesktopApiService } from '@desktop-data/desktop-data';
import { filter } from 'rxjs/operators';

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
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockComponent {
  private readonly _api: DesktopApiService = inject(DesktopApiService);

  private readonly _nameList$: Subject<StockNameItem[]> = new BehaviorSubject<
    StockNameItem[]
  >([]);

  public readonly controlName: FormControl<StockNameItem | null> =
    new FormControl<StockNameItem | null>(null);

  public readonly controlListName: FormControl<string | null> = new FormControl<
    string | null
  >(null);

  @Input() set data(value: StockNameItem[] | null) {
    if (value) {
      this.controlName.patchValue(value[0]);
      this._nameList$.next(value);
    }
  }

  public readonly stringify: TuiStringHandler<StockNameItem> = (
    item: StockNameItem
  ) => item.name;

  public readonly nameList$: Observable<StockNameItem[]> =
    this._nameList$.asObservable();

  public readonly list$: Observable<StockListItem[]> =
    this.controlName.valueChanges.pipe(
      filter((value: StockNameItem | null): value is StockNameItem => !!value),
      switchMap((value: StockNameItem) => this._api.getStock(value.id))
    );

  signatureVisible: boolean = false;

  public toggle(): void {
    this.signatureVisible = !this.signatureVisible;
  }

  public trackByStockNameItem(_: number, item: StockNameItem): number | string {
    return item.id;
  }
}
