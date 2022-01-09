import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtTableWidgetComponent } from './table.component';

describe('TableComponent', () => {
  let component: VtTableWidgetComponent;
  let fixture: ComponentFixture<VtTableWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VtTableWidgetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VtTableWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
