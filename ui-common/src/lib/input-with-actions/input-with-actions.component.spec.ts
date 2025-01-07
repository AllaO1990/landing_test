import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputWithActionsComponent } from './input-with-actions.component';

describe('FormInputComponent', () => {
  let component: InputWithActionsComponent;
  let fixture: ComponentFixture<InputWithActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputWithActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputWithActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
