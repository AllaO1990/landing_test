import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnterIdeaComponent } from './idea.component';

describe('IdeaComponent', () => {
  let component: EnterIdeaComponent;
  let fixture: ComponentFixture<EnterIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterIdeaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
