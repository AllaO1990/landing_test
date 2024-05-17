import { Component, Input } from '@angular/core';
import { OUT_COLUMNS, OUT_HEADER } from '../out.constants';
import {
  CdkFixedSizeVirtualScroll,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  TuiFormatNumberPipeModule,
  TuiLoaderModule,
  TuiScrollbarModule,
} from '@taiga-ui/core';
import { OutHeaderItem } from '../out.types';
import { scaleLinear } from 'd3-scale';
import { color } from 'd3-color';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';

export const getColor = scaleLinear(
  [1, 5, 10],
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
  selector: 'vt-out-table',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    CdkFixedSizeVirtualScroll,
    ScrollingModule,
    TuiTableModule,
    TuiLoaderModule,
    TuiScrollbarModule,
    TuiFormatNumberPipeModule,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OutTableComponent {
  public readonly header: OutHeaderItem[][] = OUT_HEADER;
  public readonly columnList: string[] = OUT_COLUMNS;

  @Input() data: any[] | null = null;

  getColorBackGround = getColorBackGround;

  public trackByIndex(index: number): number {
    return index;
  }

  public trackById(_: number, item: { id: string | number }): number | string {
    return item.id;
  }
}
