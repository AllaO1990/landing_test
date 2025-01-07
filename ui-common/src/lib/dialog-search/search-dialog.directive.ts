import { DestroyRef, Directive, EventEmitter, inject, Injector, Output } from '@angular/core';
import { SearchDialogComponent } from './search-dialog.component';
import { StockInstrument } from 'types/stock';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DIALOG, DialogService } from '@ui/components/dialog';

@Directive({
  selector: '[searchDialog]',
  exportAs: 'SearchDialog',
  standalone: true,
  providers: [],
})
export class SearchDialogDirective {
  private readonly _injector: Injector = inject(Injector);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private _loadComponent: PolymorpheusComponent<SearchDialogComponent> | null = null;

  @Output() selected: EventEmitter<StockInstrument | null> = new EventEmitter<StockInstrument | null>();

  async onSearch(event: Event) {
    event.preventDefault();

    this._loadComponent = await import('./search-dialog.component')
      .then((m) => m.SearchDialogComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._dialogService
      .open<StockInstrument | null>(this._loadComponent, {
        appearance: 'dialog-search',
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((instrument: StockInstrument | null) => this.selected.emit(instrument));
  }
}
