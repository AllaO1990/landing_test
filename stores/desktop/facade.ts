import { DesktopService } from '@desktop-data/desktop-data';
import { IndicatorAtrStore } from './plugins/indicator.atr.store';
import { IndicatorEmaStore } from './plugins/indicator.ema.store';
import { IndicatorSmaStore } from './plugins/indicator.sma.store';
import { ConsolidationZonesStore } from './plugins/consolidation-zones.store';
import { ConsolidationZonesWatchlistStore } from './plugins/consolidation-zones-watchlist.store';
import { ConsolidationZonesIdeaStore } from './plugins/consolidation-zones-idea.store';
import { CandlesStore } from './plugins/candles.store';
import { FiguresStore } from './plugins/figures.store';
import { StockPositionStore } from './plugins/stock-position.store';
import { StockIdeaStore } from './plugins/stock-idea.store';
import { StockListStore } from 'stores/plugins/stock-list.store';
import { StockPriceStore } from 'stores/plugins/stock-price.store';

export class FacadeStore {
  readonly stockList = this._buildStockList();
  readonly positionList = this._buildStockPosition();
  readonly ideaList = this._buildStockIdea();
  readonly priceList = this._buildStockPrice();
  readonly candles = this._buildCandles();
  readonly sma = this._buildIndicatorSma();
  readonly ema = this._buildIndicatorEma();
  readonly consolidationZones = this._buildConsolidationZones();
  readonly consolidationZonesIdea = this._buildConsolidationZoneIdea();
  readonly consolidationZonesWatch = this._buildConsolidationZoneWatchlist();
  readonly figures = this._buildFigures();

  constructor(private readonly _api: DesktopService) {}

  private _buildIndicatorAtr() {
    return new IndicatorAtrStore(this._api);
  }

  private _buildIndicatorEma() {
    return new IndicatorEmaStore(this._api);
  }

  private _buildIndicatorSma() {
    return new IndicatorSmaStore(this._api);
  }

  private _buildConsolidationZones() {
    return new ConsolidationZonesStore(this._api);
  }

  private _buildConsolidationZoneIdea() {
    return new ConsolidationZonesIdeaStore(this._api);
  }

  private _buildConsolidationZoneWatchlist() {
    return new ConsolidationZonesWatchlistStore(this._api);
  }

  private _buildCandles() {
    return new CandlesStore(this._api);
  }

  private _buildFigures() {
    return new FiguresStore(this._api);
  }

  private _buildStockPosition() {
    return new StockPositionStore(this._api);
  }

  private _buildStockIdea() {
    return new StockIdeaStore(this._api);
  }

  private _buildStockList() {
    return new StockListStore(this._api);
  }

  private _buildStockPrice() {
    return new StockPriceStore(this._api);
  }
}
