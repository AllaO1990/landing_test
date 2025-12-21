import { DestroyRef, Directive, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { TuiIcons } from '@taiga-ui/core';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';

@Directive({
  selector: 'button[candlestickChartButton]',
  standalone: true,
  host: {
    '(click)': 'onClick($event)',
  },
})
export class ChartCandlestickButtonDirective implements OnInit {
  #destroyRef: DestroyRef = inject(DestroyRef);
  #icon: TuiIcons = inject(TuiIcons);
  #queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly isShow: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.#queryParams
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.#queryParams.value()),
        map((params: Params) => params['chart'] && params['chart'] === 'candlestick'),
        distinctUntilChanged()
      )
      .subscribe((isShow: boolean) => {
        this.isShow.set(isShow);
        this.#icon.iconEnd.set(isShow ? '@tui.chevrons-up' : '@tui.chevrons-down');
      });
  }

  onClick(event: Event): void {
    event.preventDefault();

    this.#queryParams.update(
      {
        chart: this.isShow() ? undefined : 'candlestick',
      },
      'merge'
    );
  }
}
