import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnterSidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: EnterSidebarComponent;
  let fixture: ComponentFixture<EnterSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
