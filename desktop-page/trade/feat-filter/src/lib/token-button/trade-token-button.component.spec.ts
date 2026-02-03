import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradeTokenButton } from './trade-token-button.component';

describe('TokenButtonComponent', () => {
	let component: TradeTokenButton;
	let fixture: ComponentFixture<TradeTokenButton>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TradeTokenButton],
		}).compileComponents();

		fixture = TestBed.createComponent(TradeTokenButton);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
