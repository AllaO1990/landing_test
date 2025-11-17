import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClosePositionComponent } from './close-position.component';

describe('ClosePositionComponent', () => {
  let component: ClosePositionComponent;
  let fixture: ComponentFixture<ClosePositionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClosePositionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClosePositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
