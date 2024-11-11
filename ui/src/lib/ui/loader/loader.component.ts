import { TuiLoader } from "@taiga-ui/core";
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [TuiLoader],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoaderComponent {
  @Input() text = 'Загрузка...';
}
