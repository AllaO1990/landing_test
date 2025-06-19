import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmTradeComponent } from './confirm.component';

describe('ConfirmComponent', () => {
  let component: ConfirmTradeComponent;
  let fixture: ComponentFixture<ConfirmTradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmTradeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmTradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
