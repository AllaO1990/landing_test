import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradeFilter } from './trade-filter.component';

describe('FilterComponent', () => {
	let component: TradeFilter;
	let fixture: ComponentFixture<TradeFilter>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TradeFilter],
		}).compileComponents();

		fixture = TestBed.createComponent(TradeFilter);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
