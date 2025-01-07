import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogApproveComponent } from './dialog-approve.component';

describe('DialogComponent', () => {
  let component: DialogApproveComponent;
  let fixture: ComponentFixture<DialogApproveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogApproveComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
