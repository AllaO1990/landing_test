import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
  selector: 'vt-table-widget',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vt-table-widget',
  },
})
export class VtTableWidgetComponent implements OnInit {
  MY_DATA = {
    columns: [
      { value: 'direction', name: 'Направление' },
      { value: 'ticker', name: 'Тикер' },
      { value: 'price', name: 'Цена' },
      {
        value: 'priceEntry',
        name: `Цена вх
    Стоимость вх`,
      },
      { value: 'purpose', name: `Цель` },
      { value: 'stop', name: `Стоп` },
      {
        value: 'depo',
        name: `Кол-во
    % депо`,
      },
      {
        value: 'success',
        name: `Успех %
    Условия`,
      },
      { value: 'vanya', name: `Идея VANYA` },
    ],
    data: [
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
        status: 'orange',
      },
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
        status: 'red',
      },
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
        status: 'green',
      },
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
      },
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
      },
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
      },
      {
        direction: 'лонг',
        ticker: 'ALRS4',
        price: 4600,
        priceEntry: [4500, 9000],
        purpose: [4815, 7],
        stop: [4382, -2.63],
        depo: [4382, -2.63],
        success: [100, '10/10'],
        vanya: true,
      },
    ],
  };
  displayedColumns: string[] = this.MY_DATA.columns.map(
    (column) => column.value
  );

  namesOfColumns = Object.create(null);
  dataSource = new VtTableDataSource(this.MY_DATA.data);

  @Input() dataType: 'entry' | 'out' = 'entry';

  constructor() {}

  ngOnInit(): void {
    this.MY_DATA.columns.forEach((column) => {
      this.namesOfColumns[column.value] = column.name;
    });
  }
}

export class VtTableDataSource extends DataSource<PeriodicElement> {
  /** Stream of data that is provided to the table. */
  data = new BehaviorSubject<any[]>(this.datas);

  constructor(public datas: any) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<PeriodicElement[]> {
    return this.data;
  }

  disconnect() {}
}
