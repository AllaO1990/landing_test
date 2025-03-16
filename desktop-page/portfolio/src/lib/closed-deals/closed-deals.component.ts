import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WrapperTableComponent } from './table/table.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'portfolio-closed-deals',
  standalone: true,
  imports: [ReactiveFormsModule, WrapperTableComponent],
  templateUrl: './closed-deals.component.html',
  styleUrl: './closed-deals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {
  readonly formControl: FormControl = new FormControl(null);
}
