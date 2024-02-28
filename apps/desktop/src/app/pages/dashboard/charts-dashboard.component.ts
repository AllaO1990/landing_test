import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { VtLocalStorageService } from 'src/app/core/storage/local-storage.service';

@Component({
  selector: 'gpn-dashboard',
  templateUrl: './charts-dashboard.component.html',
  styleUrls: ['./charts-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsDashboardComponent implements OnInit {
  dashboardSettings: { timeframe: string };

  constructor(private _storageService: VtLocalStorageService) {
    this.dashboardSettings = _storageService.getObject('dashboard');
  }

  ngOnInit(): void {}
}
