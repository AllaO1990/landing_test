import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { scaleLinear } from 'd3-scale';
import { color } from 'd3-color';
import { Idea } from 'types/idea';
import { EntryHeaderItem } from '../entry/entry.types';
import { ENTRY_HEADER } from '../entry/entry.constants';
import { OUT_COLUMNS, OUT_HEADER } from './out.constants';
import { OutHeaderItem } from './out.types';
import { DesktopLkStore } from '../../../../../../stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';

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
  selector: 'vt-out',
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutComponent {
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  public readonly header: OutHeaderItem[][] = OUT_HEADER;

  public readonly columnList: string[] = OUT_COLUMNS;

  @Input() data = [];

  constructor() {}

  public trackByIndex(index: number): number {
    return index;
  }

  public trackById(_: number, item: { id: string | number }): number | string {
    return item.id;
  }

  getColorBackGround = getColorBackGround;
}
