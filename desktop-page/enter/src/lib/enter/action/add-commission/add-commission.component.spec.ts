import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCommissionComponent } from './add-commission.component';

describe('AddCommossionComponent', () => {
  let component: AddCommissionComponent;
  let fixture: ComponentFixture<AddCommissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCommissionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddCommissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
