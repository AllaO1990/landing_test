import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtStarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: VtStarRatingComponent;
  let fixture: ComponentFixture<VtStarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VtStarRatingComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VtStarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
