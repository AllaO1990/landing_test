import { ChangeDetectionStrategy, Component, ContentChild, Input, TemplateRef, ViewChild } from '@angular/core';
import { ItemComponent } from './item/item.component';
import { ItemDirective } from './item/item.directive';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualForOfContext,
  CdkVirtualScrollableElement,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { StockId } from 'types/stock';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiLoaderModule, TuiScrollbarModule } from '@taiga-ui/core';
import { PolymorpheusContent, PolymorpheusModule } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'lib-enter-list[itemSize]',
  standalone: true,
  imports: [
    ItemComponent,
    ItemDirective,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    NgIf,
    NgTemplateOutlet,
    TuiLoaderModule,
    CdkFixedSizeVirtualScroll,
    TuiScrollbarModule,
    PolymorpheusModule,
    CdkVirtualScrollableElement,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  get template(): TemplateRef<any> {
    return this.item ? this.item.template : this.simple;
  }

  @Input() list: { id: StockId }[] | null = null;

  @Input() itemSize = 28;

  @Input() header: PolymorpheusContent | null = null;

  @Input() footer: PolymorpheusContent | null = null;

  @ContentChild(ItemDirective)
  public readonly item: ItemDirective | null = null;

  @ViewChild('simple', { static: true })
  public readonly simple!: TemplateRef<CdkVirtualForOfContext<{ id: StockId }>>;
}
