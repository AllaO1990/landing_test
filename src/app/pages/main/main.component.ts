import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

declare const TradingView: any;

@Component({
  selector: 'gpn-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    new TradingView.widget({
      autosize: true,
      symbol: 'NASDAQ:AAPL',
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'ru',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: 'tradingview_main_chart',
    });
  }
}
