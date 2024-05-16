import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ENTRY_CONSTANTS } from './entry.constants';
import { Idea } from 'types/idea';
import { STOCK_GROUPS } from '../stock/stock.constant';
import { EntryEnums } from './entry.enums';

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent {
  public testValue = new FormControl(null);
  public constants: { [key in EntryEnums]: string } = ENTRY_CONSTANTS;

  @Input() data: Idea[] | null = null;

  public items = STOCK_GROUPS;

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
}
