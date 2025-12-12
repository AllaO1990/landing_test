import { DestroyRef, Directive, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { TuiIcons } from '@taiga-ui/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';

@Directive({
  selector: 'button[portfolioChartButton]',
  standalone: true,
  host: {
    '(click)': 'onClick($event)',
  },
})
export class ChartPortfolioButtonDirective implements OnInit {
  #destroyRef: DestroyRef = inject(DestroyRef);
  #icon: TuiIcons = inject(TuiIcons);
  #queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly isShow: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.#queryParams
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.#queryParams.value()),
        map((params: Params) => params['chart'] && params['chart'] === 'portfolio'),
        distinctUntilChanged()
      )
      .subscribe((isShow: boolean) => {
        this.isShow.set(isShow);
        this.#icon.iconEnd.set(isShow ? '@tui.chevrons-left' : '@tui.chevrons-right');
      });
  }

  onClick(event: Event): void {
    event.preventDefault();

    this.#queryParams.update(
      {
        chart: this.isShow() ? undefined : 'portfolio',
      },
      'merge'
    );
  }
}
