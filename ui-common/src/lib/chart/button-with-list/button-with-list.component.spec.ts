import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonWithListComponent } from './button-with-list.component';

describe('ButtonWithListComponent', () => {
  let component: ButtonWithListComponent;
  let fixture: ComponentFixture<ButtonWithListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonWithListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonWithListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
