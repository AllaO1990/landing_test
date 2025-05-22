import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WithPaginationComponent } from './with-pagination.component';

describe('WithPaginationComponent', () => {
  let component: WithPaginationComponent;
  let fixture: ComponentFixture<WithPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WithPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
