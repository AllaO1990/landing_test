import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiList } from './list.component';

describe('UiList', () => {
  let component: UiList;
  let fixture: ComponentFixture<UiList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiList],
    }).compileComponents();

    fixture = TestBed.createComponent(UiList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
