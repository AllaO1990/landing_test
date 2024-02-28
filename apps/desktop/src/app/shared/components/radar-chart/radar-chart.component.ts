import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  Chart,
  Filler,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
} from 'chart.js';

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

// console.log(registerables);

@Component({
  selector: 'vt-radar-chart',
  templateUrl: './radar-chart.component.html',
  styleUrls: ['./radar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'vt-radar-chart',
  },
})
export class VtRadarChartComponent implements OnInit, AfterViewInit {
  data = {
    labels: [
      'Debt/equity',
      'EV/\n' + 'EBITDA',
      'Net profit\n' + 'Margin',
      'EBIT/Gross mar',
      'FCF/\n' + 'Net profit',
      'Net debt/\n' + 'FCF',
    ],
    datasets: [
      {
        data: [28, 48, 40, 19, 96, 100],
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)',
      },
    ],
  };

  @ViewChild('chartItem', { static: true })
  private _chartItem!: ElementRef<HTMLCanvasElement>;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    const myRadarChart = new Chart(this._chartItem.nativeElement, {
      type: 'radar',
      data: this.data,
      options: {
        scales: {
          r: {
            ticks: { display: true, stepSize: 40 },
          },
        },
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        elements: {
          line: {
            borderWidth: 2,
          },
        },
      },
    });
  }
}
