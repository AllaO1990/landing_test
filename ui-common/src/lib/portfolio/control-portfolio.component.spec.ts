import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlPortfolioComponent } from './control-portfolio.component';

describe('PortfolioComponent', () => {
  let component: ControlPortfolioComponent;
  let fixture: ComponentFixture<ControlPortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlPortfolioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlPortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
