import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TargetAddComponent } from './target-add.component';

describe('TargetAddComponent', () => {
  let component: TargetAddComponent;
  let fixture: ComponentFixture<TargetAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetAddComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TargetAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
