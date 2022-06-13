import { DataSource } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { VtIdeaComponent } from '../idea/idea.component';

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
  formGroup = new UntypedFormGroup({
    investmentPeriods: new UntypedFormGroup({
      short: new UntypedFormControl(false),
      long: new UntypedFormControl(true),
      mid: new UntypedFormControl(true),
    }),
  });

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
        rowColor: 'rgba(255, 144, 102, 0.1)',
        investmentPeriod: 'short',
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
        rowColor: 'rgba(255, 16, 59, 0.1)',
        investmentPeriod: 'long',
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
        rowColor: 'rgba(3, 147, 34, 0.1)',
        investmentPeriod: 'mid',
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

  @Input()
  set data(value: any) {
    this._data = value;
  }
  get data() {
    return this._data;
  }
  private _data: any;

  @Input() dataType: 'entry' | 'out' = 'entry';

  constructor(private _dialog: MatDialog) {}

  ngOnInit(): void {
    this.MY_DATA.columns.forEach((column) => {
      this.namesOfColumns[column.value] = column.name;
    });
  }

  get _investmentPeriods() {
    return [
      { type: 'short', name: 'Краткосрок', quantity: 3 },
      { type: 'mid', name: 'Среднесрок', quantity: 3 },
      { type: 'long', name: 'Долгосрок', quantity: 3 },
    ];
  }

  openIdeaDialod() {
    this._dialog.open(VtIdeaComponent, {
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      panelClass: 'vt-mat-dialog-container',
      autoFocus: false,
      data: { name: 'this.name', animal: ' this.animal' },
    });
  }
}

export class VtTableDataSource extends DataSource<any> {
  /** Stream of data that is provided to the table. */
  data = new BehaviorSubject<any[]>(this.datas);

  constructor(public datas: any) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<any[]> {
    return this.data;
  }

  disconnect() {}
}
