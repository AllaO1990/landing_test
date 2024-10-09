import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VtLocalStorageService } from '@core/storage';

@Component({
  selector: 'gpn-dashboard',
  templateUrl: './charts-dashboard.component.html',
  styleUrls: ['./charts-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsDashboardComponent {
  dashboardSettings: { timeframe: string };

  constructor(private _storageService: VtLocalStorageService) {
    this.dashboardSettings = _storageService.getObject('dashboard');
  }
}
