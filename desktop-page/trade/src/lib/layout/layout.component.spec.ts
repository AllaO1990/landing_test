import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradeLayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: TradeLayoutComponent;
  let fixture: ComponentFixture<TradeLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TradeLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
