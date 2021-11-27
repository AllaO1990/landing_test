import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtRadarChartComponent } from './radar-chart.component';

describe('RadarChartComponent', () => {
  let component: VtRadarChartComponent;
  let fixture: ComponentFixture<VtRadarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VtRadarChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VtRadarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
