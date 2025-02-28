import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TuiDataListWrapperComponent } from '@taiga-ui/kit';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { AccountPortfolio } from 'types/account';
import { InputWithActionsComponent } from '../input-with-actions/input-with-actions.component';
import { LoaderComponent } from '@ui/components/loader';
import { AccountFacade } from 'stores/facades/account.facade';
import { BehaviorSubject, filter, Observable, startWith, Subject, take } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { DialogApproveComponent } from '../dialog-approve';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { FormInputEvent } from '../input-with-actions';

type FormEvent = 'create' | 'rename' | null;

@Component({
  selector: 'lib-control-portfolio',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    TuiDataListWrapperComponent,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    InputWithActionsComponent,
    LoaderComponent,
  ],
  templateUrl: './control-portfolio.component.html',
  styleUrl: './control-portfolio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ControlPortfolioComponent),
      multi: true,
    },
  ],
})
export class ControlPortfolioComponent implements ControlValueAccessor, AfterViewInit {
  private readonly _injector: Injector = inject(Injector);
  private readonly _destroyed: DestroyRef = inject(DestroyRef);
  private readonly _accountStore: AccountFacade = inject(AccountFacade);
  private readonly _dialog: DialogService = inject(DIALOG);
  readonly #list$: Subject<AccountPortfolio[] | null> = new BehaviorSubject<AccountPortfolio[] | null>(null);

  #dialogApproveComponent: PolymorpheusComponent<DialogApproveComponent> | null = null;

  readonly size = 's';

  @ViewChild('templateDelete', { static: true }) templateDelete!: TemplateRef<any>;

  @Input() autoSelected = false;

  @Input()
  set items(value: AccountPortfolio[] | null) {
    this.#list$.next(value);
  }

  isDisabled = false;
  isAdd: FormEvent = null;
  onChange = (_: any) => {};
  onTouched = () => {};

  readonly form: FormGroup = new FormGroup({
    portfolio: new FormControl({ value: null, disabled: false }),
    add: new FormControl({ value: null, disabled: true }),
  });

  readonly list$: Observable<null | AccountPortfolio[]> = this.#list$.asObservable().pipe(
    tap((list: AccountPortfolio[] | null) => {
      if (list !== null && this.controlPortfolio.value === null && this.autoSelected) {
        this.controlPortfolio.patchValue(list[0], { emitEvent: true });
      }
    })
  );

  get controlPortfolio(): FormControl {
    return this.form.get('portfolio') as FormControl;
  }

  get controlAdd(): FormControl {
    return this.form.get('add') as FormControl;
  }

  writeValue(obj: any): void {
    this.controlPortfolio.patchValue(obj, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.controlPortfolio[this.isDisabled ? 'disable' : 'enable']({ emitEvent: true });
  }

  ngAfterViewInit(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this._destroyed), startWith(this.form.value))
      .subscribe((result: { portfolio: AccountPortfolio }) => {
        this.onChange(result.portfolio);
      });
  }

  onAdd(event: Event): void {
    event.preventDefault();

    this.controlAdd.patchValue(null);
    this.isAdd = 'create';
  }

  onEdit(event: Event, item: AccountPortfolio) {
    event.preventDefault();

    this.controlAdd.patchValue(item);
    this.isAdd = 'rename';
  }

  async onRemove(event: Event, item: AccountPortfolio) {
    event.stopPropagation();

    if (this.#dialogApproveComponent === null) {
      this.#dialogApproveComponent = await import('ui-common/lib/dialog-approve')
        .then((m) => m.DialogApproveComponent)
        .then((c) => new PolymorpheusComponent(c, this._injector));
    }

    this._dialog
      .open(this.#dialogApproveComponent, {
        appearance: 'dialog-remove',
        data: {
          template: this.templateDelete,
          context: { name: item.portfolio },
        },
      })
      .pipe(takeUntilDestroyed(this._destroyed))
      .subscribe((result: boolean) => {
        if (result && item.portfolioId !== null) {
          this._accountStore.deletePortfolio(item.portfolioId);
        }
      });
  }

  onFormEvent(event: FormInputEvent<AccountPortfolio>): void {
    if (event.type === 'cancel') {
      this.isAdd = null;
    }

    if (event.type === 'submit' && event.changed) {
      if (this.isAdd === 'create') {
        this._accountStore.createPortfolio(event.changed);
      }

      if (this.isAdd === 'rename') {
        const updatedPortfolio: AccountPortfolio = { ...event.value, portfolio: event.changed };

        this._accountStore.editPortfolio(updatedPortfolio);
        this._oncePatch(updatedPortfolio);
      }

      this.isAdd = null;
    }
  }

  readonly stringify: TuiStringHandler<AccountPortfolio> = (item: AccountPortfolio) => item.portfolio;

  private _oncePatch(portfolio: AccountPortfolio): void {
    this.list$
      .pipe(
        takeUntilDestroyed(this._destroyed),
        filter((list: null | AccountPortfolio[]): list is AccountPortfolio[] => list !== null),
        map(
          (list: AccountPortfolio[]) =>
            list.find(
              (item: AccountPortfolio) =>
                item.portfolioId === portfolio.portfolioId && item.portfolio === portfolio.portfolio
            ) || null
        ),
        filter((value: AccountPortfolio | null): value is AccountPortfolio => value !== null),
        take(1)
      )
      .subscribe((value: AccountPortfolio) => this.controlPortfolio.patchValue(value, { emitEvent: false }));
  }
}
