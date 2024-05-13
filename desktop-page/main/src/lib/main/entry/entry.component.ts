import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ENTRY_CONSTANTS, ENTRY_HEADER } from './entry.constants';
import { Idea } from 'types/idea';
import { EntryHeaderItem } from './entry.types';
import { scaleLinear } from 'd3-scale';
import { color } from 'd3-color';
import { STOCK_GROUPS } from '../stock/stock.constant';

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
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent {
  public testValue = new FormControl(null);
  public constants = ENTRY_CONSTANTS;

  @Input() data: Idea[] | null = null;

  public readonly header: EntryHeaderItem[] = ENTRY_HEADER;
  public readonly columnList: string[] = this.header.map(
    (item: { name: string }) => item.name
  );

  protected getColorBackGround = getColorBackGround;

  public items = STOCK_GROUPS

  public time = [
    {
      id: 1,
      text: 'Краткосрок',
    },
    {
      id: 2,
      text: 'Среднесрок',
    },
    {
      id: 3,
      text: 'Долгосрок',
    },
    {
      id: 4,
      text: 'Скальпинг',
    },
  ];

  public trackByIndex(index: number): number {
    return index;
  }
  public trackById(index: number, item: Idea): number | string {
    return item.id;
  }
}
