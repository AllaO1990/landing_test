import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { TuiLoaderModule } from '@taiga-ui/core';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [TuiLoaderModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoaderComponent {
  @Input() text = 'Загрузка...';
}
