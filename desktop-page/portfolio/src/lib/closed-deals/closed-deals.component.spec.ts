import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClosedDealsComponent } from './closed-deals.component';

describe('ClosedDealsComponent', () => {
  let component: ClosedDealsComponent;
  let fixture: ComponentFixture<ClosedDealsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClosedDealsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClosedDealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
