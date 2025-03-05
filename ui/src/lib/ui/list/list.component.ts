import { PolymorpheusContent, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
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
export class ListComponent<T> {
  get template(): TemplateRef<any> {
    return this.item ? this.item.template : this.simple;
  }

  @Input() list: T[] | null = null;

  @Input() itemSize = 28;

  @Input() header: PolymorpheusContent | null = null;

  @Input() footer: PolymorpheusContent | null = null;

  @Input() trackBy: TrackByFunction<T> | undefined = undefined;

  @ContentChild(ItemDirective)
  public readonly item: ItemDirective | null = null;

  @ViewChild('simple', { static: true })
  public readonly simple!: TemplateRef<CdkVirtualForOfContext<{ id: StockId }>>;
}
