import { TuiTextfieldControllerModule, TuiSelectModule } from "@taiga-ui/legacy";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiDataListWrapper } from '@taiga-ui/kit';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiDropdown, TuiButton } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of, ReplaySubject, Subject, switchMap, tap, timer } from 'rxjs';
import { BROKER_LIST, CURRENCY_LIST, FILTER_CONSTANTS, PORTFOLIO_LIST } from './filter.constants';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SelectListItem {
  name: string;
  value: string;
}

type SelectList = SelectListItem[];

@Component({
  selector: 'portfolio-filter',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    AsyncPipe,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListWrapper,
    NgTemplateOutlet,
    TuiButton,
    TuiDropdown,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements AfterViewInit {
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);
  readonly isMobile$: Observable<boolean> = this._breakpoint$.pipe(
    map((screen: string | null) => screen === 'mobile'),
    tap((isMobile: boolean) => !isMobile && (this.open = false))
  );
  readonly constants = FILTER_CONSTANTS;
  readonly size = 'm';

  readonly formGroup: FormGroup = new FormGroup({
    portfolio: new FormControl({ value: null, disabled: false }, Validators.required),
    broker: new FormControl({ value: null, disabled: false }, Validators.required),
    currency: new FormControl({ value: null, disabled: false }, Validators.required),
  });

  get controlPortfolio() {
    return this.formGroup.get('portfolio') as FormControl;
  }

  get controlBroker() {
    return this.formGroup.get('broker') as FormControl;
  }

  get controlCurrency() {
    return this.formGroup.get('currency') as FormControl;
  }

  readonly portfolio$: Subject<SelectList> = new ReplaySubject(1);

  readonly broker$: Subject<SelectList> = new ReplaySubject(1);

  readonly currency$: Subject<SelectList> = new ReplaySubject(1);

  readonly stringify: TuiStringHandler<SelectListItem> = (item: SelectListItem) => item.name;

  open = false;

  ngAfterViewInit(): void {
    timer(0)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        switchMap((_) => of(PORTFOLIO_LIST)),
        tap((list) => {
          this.controlPortfolio.enable({ emitEvent: false });
          this.controlPortfolio.patchValue(list[0]);
          this._cdr.markForCheck();
        })
      )
      .subscribe((res: SelectList) => this.portfolio$.next(res));

    timer(1300)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        switchMap((_) => of(BROKER_LIST)),
        tap((list) => {
          this.controlBroker.enable({ emitEvent: false });
          this.controlBroker.patchValue(list[0]);
        })
      )
      .subscribe((res: SelectList) => this.broker$.next(res));

    timer(900)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        switchMap((_) => of(CURRENCY_LIST)),
        tap((list) => {
          this.controlCurrency.enable({ emitEvent: false });
          this.controlCurrency.patchValue(list[0]);
        })
      )
      .subscribe((res: SelectList) => this.currency$.next(res));
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.open = false;
  }
}
