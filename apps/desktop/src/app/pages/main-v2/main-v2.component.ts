import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ChartModule } from './common/chart/chart.module';
import { Observable } from 'rxjs';
import { EntryModule } from '../../../../../../desktop-page/main/src/lib/main/entry/entry.module';
import { OutModule } from '../../../../../../desktop-page/main/src/lib/main/out/out.module';
import { StockComponent } from '../../../../../../desktop-page/main/src/lib/main/stock/stock.component';
import { DesktopApiService } from '../../../../../../api/desktop-data/src/lib/desktop-data';

@Component({
  selector: 'vt-main-v2',
  standalone: true,
  imports: [AsyncPipe, StockComponent, ChartModule, EntryModule, OutModule],
  templateUrl: './main-v2.component.html',
  styleUrls: ['./main-v2.component.scss'],
  providers: [],
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
