import {ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {DATA_INPUT} from "./list.constant";

@Component({
  selector: 'vt-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent implements OnInit {
  public titleList: string[] = ['Символ', 'Посл.цена', 'Изменение', 'Изм. в %', 'Сектор'];

  @Input() data = DATA_INPUT;

  constructor() {
  }

  ngOnInit(): void {
  }

  public trackByIndex(index: number): number {
    return index;
  }
}
