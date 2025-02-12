import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddDividendComponent } from './add-dividend.component';

describe('AddEntryComponent', () => {
  let component: AddDividendComponent;
  let fixture: ComponentFixture<AddDividendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDividendComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDividendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
