import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RangeWithListComponent } from './range-with-list.component';

describe('RangeWithListComponent', () => {
  let component: RangeWithListComponent;
  let fixture: ComponentFixture<RangeWithListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RangeWithListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RangeWithListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
