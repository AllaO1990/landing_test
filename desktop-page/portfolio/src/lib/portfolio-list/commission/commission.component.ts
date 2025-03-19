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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
import { PortfolioListDialog } from '../dialog';
import { CommissionStore } from 'stores/plugins/commission.store';
import { DESKTOP_API } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { BehaviorSubject, catchError, forkJoin, Observable, of, startWith, Subject, timer } from 'rxjs';
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

type Loading = {
  loadingRemove: boolean;
  loadingEdit: boolean;
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
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #injector: Injector = inject(Injector);
  readonly #store: CommissionStore = inject(CommissionStore);
  readonly #filterValue$: Subject<Params> = new BehaviorSubject({});
  readonly #cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  readonly list$ = this.#store.list$.pipe(
    map(
      (list: CommissionItem[] | null) =>
        list && list.map((item: CommissionItem) => ({ ...item, loadingEdit: false, loadingRemove: false }))
    )
  );
  readonly itemHeight = 28;

  readonly controlFilter: FormControl = new FormControl(null);

  #dialogAddComponent: PolymorpheusComponent<CommissionAddComponent> | null = null;

  ngAfterViewInit(): void {
    this.controlFilter.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlFilter.value))
      .subscribe((value) => {
        this._onLoadList();
        this.#filterValue$.next(getParamsFromFilter(value));
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

  onEdit(event: Event, item: CommissionItem & Loading): void {
    this.openDialogAdd(event, item);
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
    this.#store.load(getParamsFromFilter(this.controlFilter.value));
  }

  onRemove(event: Event, item: CommissionItem & Loading) {
    event.preventDefault();

    item.loadingRemove = true;

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
        this.#cdr.markForCheck();
      });
  }

  trackById(_: number, item: CommissionItem): number {
    return item.id;
  }
}
