import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { FooterComponent } from '../footer/footer.component';
import { DescriptionComponent } from '../description/description.component';
import { EfficiencyComponent } from '../efficiency/efficiency.component';
import { StepsComponent } from '../steps/steps.component';
import { IdeaComponent } from '../idea/idea.component';
import { InvestComponent } from '../invest/invest.component';

@Component({
	selector: 'landing-layout',
	imports: [
		ToolbarComponent,
		FooterComponent,
		DescriptionComponent,
		EfficiencyComponent,
		StepsComponent,
		IdeaComponent,
		InvestComponent,
	],
	standalone: true,
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
