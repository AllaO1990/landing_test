import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { TuiSvgModule } from '@taiga-ui/core';

@Component({
  selector: 'lib-check',
  standalone: true,
  imports: [TuiSvgModule, NgIf],
  templateUrl: './check.component.html',
  styleUrl: './check.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckComponent {
  @Input() value: boolean | null = false;
}
