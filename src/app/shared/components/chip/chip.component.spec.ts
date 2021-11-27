import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtChipComponent } from './chip.component';

describe('ChipComponent', () => {
  let component: VtChipComponent;
  let fixture: ComponentFixture<VtChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VtChipComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VtChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
