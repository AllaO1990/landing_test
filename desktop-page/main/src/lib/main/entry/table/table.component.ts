import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {
  TuiFormatNumberPipeModule,
  TuiLoaderModule,
  TuiScrollbarModule,
} from '@taiga-ui/core';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { scaleLinear } from 'd3-scale';
import { color } from 'd3-color';
import { Idea } from 'types/idea';
import { EntryHeaderItem } from '../entry.types';
import { ENTRY_HEADER } from '../entry.constants';

export const getColor = scaleLinear(
  [1, 50, 100],
  ['#FF103B', '#EEF1F9', '#039322']
);

export const getRGBA = (v: any) => {
  const c = color(v);
  if (c) {
    c.opacity = 0.1;
  }

  return c;
};

export const getColorBackGround = (v: number) => getRGBA(getColor(v));

@Component({
  selector: 'vt-entry-table',
  standalone: true,
  imports: [
    CommonModule,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    TuiFormatNumberPipeModule,
    TuiLoaderModule,
    TuiScrollbarModule,
    TuiTableModule,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryTableComponent {
  protected getColorBackGround = getColorBackGround;

  public readonly header: EntryHeaderItem[] = ENTRY_HEADER;

  public readonly columnList: string[] = this.header.map(
    (item: { name: string }) => item.name
  );

  @Input() data: Idea[] | null = null;

  public trackById(index: number, item: Idea): number | string {
    return item.id;
  }

  public trackByIndex(index: number): number {
    return index;
  }
}
