import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessPortfolioState, DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'portfolio-list-wrapper',
  standalone: true,
  imports: [LayoutComponent, AsyncPipe],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListWrapper {
  readonly #store: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);

  readonly data$: Observable<DataAccessPortfolioState> = this.#store.state$;
}
