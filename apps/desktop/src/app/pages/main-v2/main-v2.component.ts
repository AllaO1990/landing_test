import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Observable } from 'rxjs';
import { DesktopApiService } from '../../../../../../api/desktop-data/src/lib/desktop-data';
import { EntryModule } from '../../../../../../desktop-page/main/src/lib/main/entry/entry.module';
import { OutModule } from '../../../../../../desktop-page/main/src/lib/main/out/out.module';
import { StockComponent } from '../../../../../../desktop-page/main/src/lib/main/stock/stock.component';

@Component({
  selector: 'vt-main-v2',
  standalone: true,
  imports: [AsyncPipe, StockComponent, EntryModule, OutModule],
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
