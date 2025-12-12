import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PortfolioData } from '@data-access-portfolio/types';
import { AccountBalance } from 'types/account';

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

  readonly data$: Observable<PortfolioData<AccountBalance>> = this.#store.balance$;
}
