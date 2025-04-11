import { PolymorpheusContent, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  DestroyRef,
  inject,
  Input,
  NgZone,
  TemplateRef,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { ItemDirective } from './item/item.directive';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualForOfContext,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { StockId } from 'types/stock';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiScrollable, TuiScrollbar } from '@taiga-ui/core';
import { LoaderComponent } from '../loader';
import { BehaviorSubject, defer, filter, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-list[itemSize]',
  standalone: true,
  imports: [
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    NgIf,
    NgTemplateOutlet,
    CdkFixedSizeVirtualScroll,
    TuiScrollbar,
    PolymorpheusOutlet,
    LoaderComponent,
    TuiScrollable,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent<T> implements AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #ngZone: NgZone = inject(NgZone);
  readonly #scrollToTop: Subject<boolean> = new BehaviorSubject(false);

  get template(): TemplateRef<any> {
    return this.item ? this.item.template : this.simple;
  }

  @Input() set scrollToTop(value: boolean) {
    this.#scrollToTop.next(value);
  }

  @Input() templateCacheSize = 20;

  @Input() list: T[] | null = null;

  @Input() itemSize = 28;

  @Input() header: PolymorpheusContent | null = null;

  @Input() footer: PolymorpheusContent | null = null;

  @Input() trackBy: TrackByFunction<T> | undefined = undefined;

  @ContentChild(ItemDirective)
  public readonly item: ItemDirective | null = null;

  @ViewChild('simple', { static: true })
  public readonly simple!: TemplateRef<CdkVirtualForOfContext<{ id: StockId }>>;

  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport | null = null;

  readonly #viewport: Observable<CdkVirtualScrollViewport | null> = defer(() => {
    if (this.viewport !== null) {
      return of(this.viewport);
    }

    return this.#ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap(() => this.#viewport)
    );
  });

  ngAfterViewInit(): void {
    this.#scrollToTop
      .asObservable()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap((scrollToTop: boolean) => (scrollToTop ? this.#viewport : of(null))),
        filter((viewport: CdkVirtualScrollViewport | null): viewport is CdkVirtualScrollViewport => viewport !== null),
        tap((data) => console.log(data))
      )
      .subscribe((viewport: CdkVirtualScrollViewport) => viewport.scrollToIndex(0));
  }
}
