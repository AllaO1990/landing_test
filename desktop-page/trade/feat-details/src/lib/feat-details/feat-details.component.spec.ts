import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatDetailsComponent } from './feat-details.component';

describe('FeatDetailsComponent', () => {
	let component: FeatDetailsComponent;
	let fixture: ComponentFixture<FeatDetailsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FeatDetailsComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FeatDetailsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
