import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {createChart} from 'lightweight-charts';

@Component({
  selector: 'vt-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartComponent implements AfterViewInit {
  public chart: any;

  @ViewChild('chart', {static: true}) private readonly _chartElement!: ElementRef;

  constructor() {
  }

  ngOnInit(): void {

    console.log(this.chart);
  }

  ngAfterViewInit(): void {
    this.chart = createChart(this._chartElement.nativeElement);
    const lineSeries = this.chart.addLineSeries();
    lineSeries.setData([
      {time: '2019-04-11', value: 80.01},
      {time: '2019-04-12', value: 96.63},
      {time: '2019-04-13', value: 76.64},
      {time: '2019-04-14', value: 81.89},
      {time: '2019-04-15', value: 74.43},
      {time: '2019-04-16', value: 80.01},
      {time: '2019-04-17', value: 96.63},
      {time: '2019-04-18', value: 76.64},
      {time: '2019-04-19', value: 81.89},
      {time: '2019-04-20', value: 74.43},
    ]);

  }
}
