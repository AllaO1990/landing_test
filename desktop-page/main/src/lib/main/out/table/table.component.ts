import { Component, Input } from '@angular/core';
import { OUT_HEADER } from '../out.constants';
import { CdkFixedSizeVirtualScroll, ScrollingModule } from '@angular/cdk/scrolling';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiFormatNumberPipeModule, TuiLoaderModule, TuiScrollbarModule } from '@taiga-ui/core';
import { OutHeaderItem } from '../out.types';
import { scaleLinear } from 'd3-scale';
import { color } from 'd3-color';
import { DatePipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Position } from 'types/position';
import { DatePassedPipe } from '../../common/date-passed.pipe';

export const getColor = scaleLinear([1, 5, 10], ['#FF103B', '#EEF1F9', '#039322']);

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
    DatePipe,
    DatePassedPipe,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OutTableComponent {
  public readonly header: OutHeaderItem[] = OUT_HEADER;
  public readonly columnList: string[] = this.header.map((item: { name: string }) => item.name);

  @Input() data: Position[] | null = null;

  getColorBackGround = getColorBackGround;

  public trackByIndex(index: number): number {
    return index;
  }

  public trackById(_: number, item: Position): number | string {
    return item.id;
  }
}
