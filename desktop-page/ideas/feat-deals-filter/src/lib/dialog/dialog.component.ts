import { ChangeDetectionStrategy, Component, effect, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiPopup } from '@taiga-ui/core';
import { TuiDrawer } from '@taiga-ui/kit';
import { FilterDealListComponent, FilterDealValue } from '../filter';
import { Params } from '@angular/router';
import { DataAccessDealService } from '@data-access-idea/deals/data-access.service';
import { DealFilterDialogService } from './dialog.service';

@Component({
	selector: 'deal-filter-dialog',
	standalone: true,
	imports: [ReactiveFormsModule, TuiButton, TuiDrawer, TuiPopup, FilterDealListComponent],
	templateUrl: './dialog.component.html',
	styleUrl: './dialog.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
	readonly #dataAccess: DataAccessDealService = inject(DataAccessDealService);
	readonly #dialogService: DealFilterDialogService = inject(DealFilterDialogService);

	readonly control: FormControl<FilterDealValue> = new FormControl<FilterDealValue>(this.#dialogService.value(), {
		nonNullable: true,
	});

	protected readonly size = 's';

	protected readonly openFilter: Signal<boolean> = this.#dialogService.isOpenFilter;

	constructor() {
		effect(() => {
			this.control.setValue(this.#dialogService.value());
			this.control.markAsPristine();

			this.#dataAccess.params.update((params: Params | null) => ({
				...params,
				...this.#dialogService.getParams(this.#dialogService.value()),
			}));
		});
	}

	onClose(event: Event): void {
		event.preventDefault();

		this.control.reset(this.#dialogService.value());
		this.control.markAsPristine();
		this.#dialogService.close();
	}

	onReset(event: Event): void {
		event.preventDefault();

		this.#dialogService.reset();
	}

	onSubmit(event: Event): void {
		event.preventDefault();

		this.#dialogService.close();
		this.#dialogService.valueFilter.set(this.control.value);
	}
}
