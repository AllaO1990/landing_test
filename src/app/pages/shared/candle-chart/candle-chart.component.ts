import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { VtLocalStorageService } from 'src/app/core/storage/local-storage.service';
import { VtCommonSettings } from 'src/app/shared/interfaces/storage-interface';
import { DataService } from '../../../core/data/data.service';
import { TvWidgetOptions } from './candle-chart.model';
import { VtDashboardSettingsFormComponent } from './dashboard-settings-form/dashboard-settings-form.component';

declare const TradingView: any;

export type ChartViewSize = 'big' | 'small';

let uniqueId = 0;

@Component({
  selector: 'vt-chart',
  templateUrl: './candle-chart.component.html',
  styleUrls: ['./candle-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vt-candle-chart-vt-widget',
  },
})
export class VtCandleChartComponent
  implements OnInit, AfterViewInit, OnChanges
{
  uniqueId = `vt-chart-${uniqueId++}`;
  issuerControl = new UntypedFormControl('DSKY');
  lockControl = new UntypedFormControl(false);
  options: string[] = ['DSKY', 'AAPL'];
  filteredOptions!: Observable<string[]>;

  studiesMAFormControl = new UntypedFormControl(200);

  eventsFromWidget = new Subject();

  storageCommonSettings: { symbol: string } | null =
    this._storageService.getObject<VtCommonSettings>('vtCommonSettings');

  @Input()
  public set showCustomMenu(value) {
    this._showCustomMenu = value;
  }
  public get showCustomMenu() {
    return this._showCustomMenu;
  }
  private _showCustomMenu = false;

  @Input()
  public set symbol(value) {
    this._symbol = value;
  }
  public get symbol() {
    return this._symbol;
  }

  private _symbol = this.storageCommonSettings?.symbol ?? 'NASDAQ:AAPL';

  @Input()
  public set interval(value) {
    this._interval = value;
  }
  public get interval() {
    return this._interval;
  }

  private _interval = '1';

  @Input()
  get viewSize(): ChartViewSize {
    return this._viewSize;
  }

  set viewSize(value: ChartViewSize) {
    this._viewSize = value;
    this._toggleHistogramSeriesChart(value);
  }

  private _viewSize: ChartViewSize = 'big';

  private _chart!: IChartApi;

  @ViewChild('content', { read: ElementRef, static: true })
  private _content!: ElementRef<HTMLDivElement>;

  private volumeSeries!: ISeriesApi<'Histogram'>;

  tvWidgetOptions: TvWidgetOptions | null = null;

  tvWidget!: {
    options: TvWidgetOptions;
    reload: () => void;
    render: () => void;
    subscribeToQuote: (e: any) => void;
    [key: string]: any;
  };

  constructor(
    private _elementRef: ElementRef,
    private _dataService: DataService,
    private _cdr: ChangeDetectorRef,
    private _dialog: MatDialog,
    private _router: Router,
    private _storageService: VtLocalStorageService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    this._applyNewChartOptions();
  }

  ngOnInit(): void {
    this._initDefaultTvWidgetOptions();

    this.filteredOptions = this.issuerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );

    this.lockControl.valueChanges.subscribe(console.log);

    this.eventsFromWidget
      .pipe(
        distinctUntilChanged(
          (prev: any, cur: any) => prev.original_name === cur.original_name
        )
      )
      .subscribe((event) => {
        console.log(event);
        this._storageService.addOrUpdateObjectProperty('vtCommonSettings', {
          symbol: event.original_name,
        });
      });
  }

  ngAfterViewInit() {
    this.tvWidget = new TradingView.widget(this.tvWidgetOptions);

    this.tvWidget.subscribeToQuote((e: any) => {
      // console.log(e);
      this.eventsFromWidget.next(e);
    });

    addEventListener('message', (data: any) => {
      // console.log(data);
    });

    // a.subscribe('study_properties_changed', (event: any) => {
    //   console.log('SUBSCRIBE', event);
    // });

    // this._chart = createChart(this._content.nativeElement, {
    //   // leftPriceScale: { autoScale: true, visible: true },
    //   width: this._content.nativeElement.offsetWidth,
    //   height: this._content.nativeElement.offsetHeight,
    //   crosshair: {
    //     mode: CrosshairMode.Normal,
    //   },
    // });

    // this._applyNewChartOptions();

    // const candleSeries = this._chart.addCandlestickSeries();

    // this._dataService.getCandles().subscribe((data: any) => {
    //   candleSeries.setData(data);
    // });

    // this._addHistogramSeries();
  }

  private _toggleHistogramSeriesChart(viewSize: ChartViewSize) {
    if (viewSize === 'small' && this.volumeSeries) {
      this._chart.removeSeries(this.volumeSeries);
    }
  }

  private _applyNewChartOptions() {
    if (!this._chart) {
      return;
      // throw Error('chart not instantiated');
    }

    if (this.viewSize === 'small') {
      this._chart.applyOptions({
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
      });
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  private _addHistogramSeries() {
    if (this.viewSize !== 'big') {
      return;
    }

    this.volumeSeries = this._chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    this._chart.subscribeClick((event) => {
      console.log(event);
    });
  }

  lockEvent($event: Event) {
    console.log($event);
  }

  reloadTvWidget() {
    this.tvWidget.reload();
  }

  changeTvWidgetOptions() {
    this.tvWidget.options.studies = [
      {
        id: 'MASimple@tv-basicstudies',
        inputs: {
          length: this.studiesMAFormControl.value,
        },
      },
    ];
    this.reloadTvWidget();
  }

  private _initDefaultTvWidgetOptions() {
    this.tvWidgetOptions = {
      autosize: true,
      symbol: this.symbol,
      interval: this.interval,
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'ru',
      enable_publishing: false,
      // library_path: '/charting_library/',
      debug: false,
      disabled_features: [
        'use_localstorage_for_settings',
        // 'header_symbol_search',
        'symbol_search_hot_key',
        'show_labels_on_price_scale',
      ],
      hide_legend: this.viewSize === 'small',
      hide_side_toolbar: this.viewSize === 'small',
      allow_symbol_change: true,
      overrides: {
        // 'paneProperties.legendProperties.showStudyArguments': true,
        'paneProperties.legendProperties.showStudyTitles': false,
        'paneProperties.legendProperties.showStudyValues': true,
        'paneProperties.legendProperties.showSeriesTitle': true,
        'paneProperties.legendProperties.showSeriesOHLC': true,
        // 'paneProperties.background': '#ff0000',
        // 'paneProperties.vertGridProperties.color': '#ff0000',
        // 'paneProperties.horzGridProperties.color': '#ff0000',
        // 'symbolWatermarkProperties.transparency': 90,
        // 'scalesProperties.textColor': '#AAA',
        // 'mainSeriesProperties.candleStyle.wickUpColor': '#ff0000',
        // 'mainSeriesProperties.candleStyle.wickDownColor': '#ff0000',
      },
      whitelabel: '1',
      studies_overrides: {
        'moving average.ma.color.0': '#000000',
        'moving average exponential.ma.color': '#FF103B',
        // 'volume.volume.color.0': '#00FFFF',
        // 'volume.volume.color.1': '#0000FF',
        // 'volume.volume.transparency': 70,
        'volume.volume ma.color': 'rgb(245, 127, 23)',
        // 'volume.volume ma.transparency': 30,
        // 'volume.volume ma.linewidth': 5,
        'volume.volume ma.visible': true,
        // 'ema.labelsonpricescale.visible': false,
        // 'ma.show label': false,
        // 'ma.ma': false,
        // 'volume.legend.visible': false,
        // 'ema.ma.color': '#FF0000',
        // 'ema.plot.color': '#FF0000',
        // 'ema.plot_1.color': '#00FF00',

        // 'ema.outputs.show legendValues': false,
        // 'ema.ma.color.0': '#FF0000',
      },
      studies: [
        {
          id: 'MAExp@tv-basicstudies',
          inputs: {
            length: 200,
          },
        },
        {
          id: 'MASimple@tv-basicstudies',
          inputs: {
            length: 10,
          },
        },
        {
          id: 'MAExp@tv-basicstudies',
          inputs: {
            length: 30,
          },
        },
      ],
      container_id: this.uniqueId,
    };
  }

  openDashboardSettingsForm() {
    const dialogRef = this._dialog.open(VtDashboardSettingsFormComponent, {
      data: { name: 'trlolol' },
      width: '500px',
    });
    dialogRef
      .afterClosed()
      .pipe(filter((data: boolean) => data))
      .subscribe((data: any) => {
        this._storageService.addOrUpdateObjectProperty('dashboard', data);
        const url = this._router.createUrlTree(['/dashboard']);
        window.open(url.toString(), '_blank');
      });
  }
}
