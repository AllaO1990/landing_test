import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'gpn-charts-dashboard',
  templateUrl: './charts-dashboard.component.html',
  styleUrls: ['./charts-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsDashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
