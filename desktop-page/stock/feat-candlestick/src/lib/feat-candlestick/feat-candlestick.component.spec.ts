import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatCandlestickComponent } from './feat-candlestick.component';

describe('FeatCandlestickComponent', () => {
  let component: FeatCandlestickComponent;
  let fixture: ComponentFixture<FeatCandlestickComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatCandlestickComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatCandlestickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
