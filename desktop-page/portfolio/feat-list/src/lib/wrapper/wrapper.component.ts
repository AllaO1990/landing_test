import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessPortfolioState, DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { DataAccessPortfolioService } from '@data-access-portfolio/data.access.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'portfolio-list-wrapper',
  standalone: true,
  imports: [LayoutComponent, AsyncPipe],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  providers: [DataAccessPortfolioService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListWrapper {
  readonly #dataAccess: DataAccessPortfolioService = inject(DataAccessPortfolioService);
  readonly #store: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);

  data$: Observable<DataAccessPortfolioState> = this.#store.state$;

  constructor() {
    effect(
      () => {
        this.#store.loadAccountBalance(this.#dataAccess.params());
      },
      { allowSignalWrites: true }
    );
  }
}
