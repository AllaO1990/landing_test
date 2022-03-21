import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VtScreenerComponent } from './screener.component';

describe('ChartComponent', () => {
  let component: VtScreenerComponent;
  let fixture: ComponentFixture<VtScreenerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VtScreenerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VtScreenerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
