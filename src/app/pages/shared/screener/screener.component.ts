import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Observable } from 'rxjs';
import { DataService } from '../../../core/data/data.service';

declare const TradingView: any;

export type ChartViewSize = 'big' | 'small';

let uniqueId = 0;

@Component({
  selector: 'vt-screener',
  templateUrl: './screener.component.html',
  styleUrls: ['./screener.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vt-candle-chart-widget',
  },
})
export class VtScreenerComponent implements OnInit, AfterViewInit, OnChanges {
  uniqueId = `vt-chart-${uniqueId++}`;
  issuerControl = new UntypedFormControl('DSKY');
  lockControl = new UntypedFormControl(false);
  options: string[] = ['DSKY', 'AAPL'];
  filteredOptions!: Observable<string[]>;

  studiesMAFormControl = new UntypedFormControl(200);

  @Input()
  get viewSize(): ChartViewSize {
    return this._viewSize;
  }

  set viewSize(value: ChartViewSize) {
    this._viewSize = value;
  }

  private _viewSize: ChartViewSize = 'big';

  private _chart!: IChartApi;

  @ViewChild('content', { read: ElementRef, static: true })
  private _content!: ElementRef<HTMLDivElement>;

  private volumeSeries!: ISeriesApi<'Histogram'>;

  constructor(
    private _elementRef: ElementRef,
    private _dataService: DataService,
    private _cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private _document: Document
  ) {}

  ngOnChanges(changes: SimpleChanges) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    // this.tvWidget = new TradingView.widget(this.tvWidgetOptions);

    const scriptEl = this._document.createElement('script');

    scriptEl.type = 'text/javascript';

    scriptEl.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';

    scriptEl.innerHTML = `{
      "width": "100%",
      "height": "100%",
      "defaultColumn": "overview",
      "defaultScreen": "general",
      "showToolbar": true,
      "locale": "ru",
      "market": "us",
      "colorTheme": "light"
    }`;

    this._elementRef.nativeElement.appendChild(scriptEl);
  }
}
