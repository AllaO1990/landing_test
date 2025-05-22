import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Injector,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiHint } from '@taiga-ui/core';
import { PortfolioListDialog } from '../dialog';
import { CommissionStore } from 'stores/plugins/commission.store';
import { DESKTOP_API, QUERY_PARAMS } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { catchError, combineLatest, debounceTime, filter, forkJoin, Observable, of, startWith, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommissionAddComponent } from './add/add.component';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { LoaderComponent } from '@ui/components/loader';
import { Params } from '@angular/router';
import { CommissionItem } from 'types/commission';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { Response } from 'types/response';
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { DialogFilterComponent } from '../dialog-filter/dialog-filter.component';
import { getParamsFromFilter } from '../utils';
import { QueryParams } from 'utils/query-params';
import { CommissionAddWithTickerComponent } from './add-with-ticker/add-with-ticker.component';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';

type Loading = {
  loadingRemove: boolean;
  loadingEdit: boolean;
  disabled: boolean;
};

@Component({
  selector: 'lib-commission',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    AsyncPipe,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    DatePipe,
    ItemDirective,
    ListComponent,
    LoaderComponent,
    HeaderComponent,
    TuiFormatNumberPipe,
    TuiButtonLoading,
    DialogFilterComponent,
    TuiHint,
    WithPaginationComponent,
  ],
  templateUrl: './commission.component.html',
  styleUrls: ['../dialog.scss', './commission.component.scss'],
  animations: [triggerHeightAnimations],
  providers: [
    {
      provide: CommissionStore,
      useFactory: (api: DesktopService) => new CommissionStore(api),
      deps: [DESKTOP_API],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommissionComponent extends PortfolioListDialog implements AfterViewInit {
  readonly #dialogService: DialogService = inject(DIALOG);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #injector: Injector = inject(Injector);
  readonly #store: CommissionStore = inject(CommissionStore);
  readonly #cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  readonly listLimit: number[] = [10, 50, 100];
  readonly list$ = this.#store.list$.pipe(
    map(
      (list: CommissionItem[] | null) =>
        list &&
        list.map((item: CommissionItem) => ({
          ...item,
          loadingEdit: false,
          loadingRemove: false,
          disabled: item.ideaId !== null,
        }))
    )
  );

  total$: Observable<number> = this.#store.total$.pipe(
    filter((value: number | null): value is number => value !== null)
  );

  readonly itemHeight = 28;

  readonly formGroup: FormGroup = new FormGroup({
    filter: new FormControl(null),
    pagination: new FormControl({
      limit: this.listLimit[1],
      page: 0,
    }),
  });

  get controlFilter(): FormControl {
    return this.formGroup.get('filter') as FormControl;
  }

  get controlPagination(): FormControl {
    return this.formGroup.get('pagination') as FormControl;
  }

  #dialogAddComponent: PolymorpheusComponent<CommissionAddComponent> | null = null;
  #dialogAddWithTickerComponent: PolymorpheusComponent<CommissionAddWithTickerComponent> | null = null;

  ngAfterViewInit(): void {
    const valueChange$ = this.controlFilter.valueChanges.pipe(
      startWith(this.controlFilter.value),
      filter((value: null | any) => value !== null)
    );

    const pagination$ = this.controlPagination.valueChanges.pipe(
      startWith(this.controlPagination.value),
      filter((value: null | Params): value is Params => value !== null)
    );

    combineLatest([valueChange$, pagination$])
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(0))
      .subscribe((_) => {
        this._onLoadList();
      });
  }

  async openDialogAdd(event: Event, value: any | null = null): Promise<void> {
    event.preventDefault();

    if (!this.#dialogAddComponent) {
      this.#dialogAddComponent = await import('./add/add.component')
        .then((m) => m.CommissionAddComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    const data = value !== null ? value : this.controlFilter.value;

    this._openDialog(
      this.#dialogAddComponent as PolymorpheusComponent<CommissionAddComponent>,
      data,
      'Ввести комиссию'
    ).subscribe((response: boolean) => {
      if (response) {
        this._onLoadList();
      }
    });
  }

  async openDialogAddWithTicker(event: Event, value: (CommissionItem & Loading) | null = null): Promise<void> {
    event.preventDefault();

    if (!this.#dialogAddWithTickerComponent) {
      this.#dialogAddWithTickerComponent = await import('./add-with-ticker/add-with-ticker.component')
        .then((m) => m.CommissionAddWithTickerComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    const data = value !== null ? value : this.controlFilter.value;

    this._openDialog(
      this.#dialogAddWithTickerComponent as PolymorpheusComponent<CommissionAddWithTickerComponent>,
      data,
      'Ввести комиссию'
    ).subscribe((response: boolean) => {
      if (response) {
        this._onLoadList();
      }
    });
  }

  onEdit(event: Event, item: CommissionItem & Loading): void {
    this.openDialogAdd(event, item).then(() => {
      item.loadingEdit = false;
    });
    item.loadingEdit = true;
  }

  onEditWithTicker(event: Event, item: CommissionItem & Loading): void {
    this.openDialogAddWithTicker(event, item).then(() => {
      item.loadingEdit = false;
    });
    item.loadingEdit = true;
  }

  onShow(event: Event, item: CommissionItem & Loading): void {
    event.preventDefault();

    this.#queryParams.update({ id: item.ideaId, dialog: 'visible' }, 'merge');
  }

  private _openDialog(c: PolymorpheusComponent<any>, data: any = null, label: string | null = null): Observable<any> {
    return this.#dialogService
      .open(c, {
        appearance: 'dialog-block',
        data,
        label,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef));
  }

  private _onLoadList(): void {
    const params = {
      ...getParamsFromFilter(this.controlFilter.value),
      ...this.controlPagination.value,
    };

    this.#store.load(params);
  }

  onRemove(event: Event, item: CommissionItem & Loading) {
    event.preventDefault();

    item.loadingRemove = true;
    item.disabled = true;

    forkJoin([this.#store.deleteCommission(item.id), timer(1000)])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        map(([response]: [Response<any>, number]) => response),
        catchError((error: any) => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe((res) => {
        this._onLoadList();
        item.loadingRemove = false;
        item.disabled = false;
        this.#cdr.markForCheck();
      });
  }

  trackById(_: number, item: CommissionItem): number {
    return item.id;
  }
}
