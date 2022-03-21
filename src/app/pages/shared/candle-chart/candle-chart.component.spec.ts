import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VtCandleChartComponent } from './candle-chart.component';

describe('ChartComponent', () => {
  let component: VtCandleChartComponent;
  let fixture: ComponentFixture<VtCandleChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VtCandleChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VtCandleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
