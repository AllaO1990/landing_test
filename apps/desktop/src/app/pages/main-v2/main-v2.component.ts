import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ChartModule } from './common/chart/chart.module';
import { EntryModule } from './common/entry/entry.module';
import { OutModule } from './common/out/out.module';
import { DesktopApiService } from '../../../../../../api/desktop-data/src/lib/desktop-data/desktop.api.service';
import { Observable } from 'rxjs';
import { StockListComponent } from './common/stock-list/stock-list.component';

@Component({
  selector: 'vt-main-v2',
  standalone: true,
  imports: [
    AsyncPipe,
    StockListComponent,
    ChartModule,
    EntryModule,
    OutModule
  ],
  templateUrl: './main-v2.component.html',
  styleUrls: ['./main-v2.component.scss'],
  providers: [
    DesktopApiService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainV2Component implements OnInit {
  private readonly _api: DesktopApiService = inject(DesktopApiService);

  public readonly ideaList$: Observable<any> = this._api.getIdeaList();

  public readonly tradeList$: Observable<any> = this._api.getTradeList();

  public readonly stockList$: Observable<any> = this._api.getStockList();

  constructor() {}

  ngOnInit(): void {}
}
