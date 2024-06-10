import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnterActionComponent } from './action.component';

describe('ActionComponent', () => {
  let component: EnterActionComponent;
  let fixture: ComponentFixture<EnterActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
