import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidDateComponent } from './valid-date.component';

describe('ValidDateComponent', () => {
  let component: ValidDateComponent;
  let fixture: ComponentFixture<ValidDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidDateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
