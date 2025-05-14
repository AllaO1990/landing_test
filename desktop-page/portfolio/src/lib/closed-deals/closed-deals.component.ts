import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WrapperTableComponent } from './table/table.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { TuiButton } from '@taiga-ui/core';
import { OUT_CONSTANTS } from '../../../../main/src/lib/main/out/out.constants';
import { StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

@Component({
  selector: 'portfolio-closed-deals',
  standalone: true,
  imports: [ReactiveFormsModule, WrapperTableComponent, SearchDialogDirective, TuiButton],
  templateUrl: './closed-deals.component.html',
  styleUrl: './closed-deals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly size = 's';
  readonly formControl: FormControl = new FormControl(null);
  protected readonly constants = OUT_CONSTANTS;

  onOpenDialog(event: StockInstrument | null): void {
    if (event) {
      this.#queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
        dialog: 'visible',
      });
    }
  }
}
