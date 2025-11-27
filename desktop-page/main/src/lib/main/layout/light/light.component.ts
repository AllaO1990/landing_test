import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Structure } from '@feat-structure';

@Component({
  selector: 'main-light',
  standalone: true,
  imports: [Structure],
  templateUrl: './light.component.html',
  styleUrl: './light.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightComponent {
  chart = false;
}
