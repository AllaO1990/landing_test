import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TokenButtonComponent } from './token-button.component';

describe('TokenButtonComponent', () => {
  let component: TokenButtonComponent;
  let fixture: ComponentFixture<TokenButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TokenButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
