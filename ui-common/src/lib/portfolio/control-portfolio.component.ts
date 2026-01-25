import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
  Input,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {TuiButton, TuiDropdown, TuiTextfield} from '@taiga-ui/core';
import {TuiChevron, TuiDataListWrapper, TuiSelect} from '@taiga-ui/kit';
import {TuiStringHandler} from '@taiga-ui/cdk';
import {AccountPortfolio} from 'types/account';
import {LoaderComponent} from '@ui/components/loader';
import {AccountFacade} from 'stores/facades/account.facade';
import {BehaviorSubject, filter, Observable, startWith, Subject, take} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DialogApproveService} from '../dialog-approve';
import {DialogCoreComponent} from '@ui/components/dialog';
import {FormInputEvent, InputWithActionsComponent} from '../input-with-actions';

type FormEvent = 'create' | 'rename' | null;

type Portfolio = AccountPortfolio & { edit: boolean; remove: boolean };

@Component({
	selector: 'lib-control-portfolio',
	standalone: true,
	imports: [
		AsyncPipe,
		FormsModule,
		ReactiveFormsModule,
		TuiButton,
		InputWithActionsComponent,
		LoaderComponent,
		TuiTextfield,
		TuiDataListWrapper,
		TuiSelect,
		TuiChevron,
		TuiDropdown,
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
export class ControlPortfolioComponent extends DialogCoreComponent implements ControlValueAccessor, AfterViewInit {
	private readonly _injector: Injector = inject(Injector);
	private readonly _destroyed: DestroyRef = inject(DestroyRef);
	private readonly _accountStore: AccountFacade = inject(AccountFacade);
	readonly #list$: Subject<Portfolio[] | null> = new BehaviorSubject<Portfolio[] | null>(null);
	#dialogApproveService: DialogApproveService = inject(DialogApproveService);

	@ViewChild('templateDelete', { static: true }) templateDelete!: TemplateRef<any>;

	@Input() autoSelected = false;

	@Input()
	set items(value: (AccountPortfolio | Portfolio)[] | null) {
		this.#list$.next(this._createPortfolios(value));
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
			.subscribe((result: { portfolio: Portfolio }) => {
				this.onChange(result.portfolio);
			});
	}

	onAdd(event: Event): void {
		event.preventDefault();

		this.controlAdd.patchValue(null, { emitEvent: false });
		this.isAdd = 'create';
	}

	onEdit(event: Event, item: AccountPortfolio) {
		event.preventDefault();

		this.controlAdd.patchValue(item);
		this.isAdd = 'rename';
	}

	async onRemove(event: Event, item: AccountPortfolio) {
		event.stopPropagation();

		this.#dialogApproveService
			.openDialog(this._injector, {
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
	stringifyPortfolio = signal((x: AccountPortfolio) => x.portfolio);
	identityMatcherPortfolio = signal((a: AccountPortfolio, b: AccountPortfolio) => a.portfolioId === b.portfolioId);

	private _oncePatch(portfolio: AccountPortfolio): void {
		this.list$
			.pipe(
				takeUntilDestroyed(this._destroyed),
				filter((list: null | AccountPortfolio[]): list is AccountPortfolio[] => list !== null),
				map(
					(list: AccountPortfolio[]) =>
						list.find(
							(item: AccountPortfolio) => item.portfolioId === portfolio.portfolioId && item.portfolio === portfolio.portfolio
						) || null
				),
				filter((value: AccountPortfolio | null): value is AccountPortfolio => value !== null),
				take(1)
			)
			.subscribe((value: AccountPortfolio) => this.controlPortfolio.patchValue(value, { emitEvent: true }));
	}

	private _createPortfolios(list: AccountPortfolio[] | null): null | Portfolio[] {
		if (list === null) {
			return list;
		}

		return list.map((item: AccountPortfolio) => ({ edit: true, remove: true, ...item }));
	}
}
