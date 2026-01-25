import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AddForm } from '../add';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { AccountFacade } from 'stores/facades/account.facade';
import { Observable } from 'rxjs';
import { AccountBroker } from 'types/account';
import { TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {
	TuiInputDateTimeModule,
	TuiSelectModule,
	TuiTextareaModule,
	TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiButton, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumberDirective } from '@taiga-ui/kit';

const completeDateTimeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
	control.value.every(Boolean) ? null : { incompleteDateTime: true };

@Component({
	selector: 'lib-form-price-lots-commission',
	standalone: true,
	imports: [
		AsyncPipe,
		ReactiveFormsModule,
		TuiInputDateTimeModule,
		NgIf,
		TuiButton,
		NgForOf,
		TuiAutoFocus,
		TuiInputNumberDirective,
		TuiNumberFormat,
		TuiTextfieldControllerModule,
		TuiSelectModule,
		TuiTextfield,
		TuiTextareaModule,
	],
	templateUrl: './add-commission.component.html',
	styleUrls: ['../add.scss', './add-commission.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCommissionComponent extends AddForm implements OnInit {
	readonly #service: AccountFacade = inject(AccountFacade);

	readonly form: FormGroup = new FormGroup({
		date: new FormControl({ value: [null, null], disabled: true }, completeDateTimeValidator),
		size: new FormControl({ value: null, disabled: true }, Validators.required),
		comment: new FormControl({ value: null, disabled: true }),
		brokerId: new FormControl({ value: null, disabled: true }, Validators.required),
	});

	readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;
	readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
	readonly maxDate = TuiDay.fromLocalNativeDate(this.today);

	@tuiPure
	protected stringify(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
		const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

		return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
	}

	ngOnInit(): void {
		if (this.context.data) {
			const { date, size, comment, brokerId } = this.context.data;

			this.form.patchValue({
				size: size || null,
				comment: comment || null,
				date: this.getTuiDates(date || new Date().toISOString()),
				brokerId: brokerId || null,
			});
		}

		const controlDate = this.form.get('date') as FormControl;

		controlDate.valueChanges.pipe(this.updateControlDate(controlDate)).subscribe();
	}

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();

		if (this.context) {
			const { date, size, comment, brokerId } = this.form.value;
			const totalEntry = this.context.data.totalEntry || null;

			this.context.completeWith({
				...this.context.data,
				date: this.getISOString(date[0], date[1]),
				size,
				comment,
				profitPct: totalEntry && (size / totalEntry) * 100,
				brokerId: brokerId || null,
			});
		}
	}
}
