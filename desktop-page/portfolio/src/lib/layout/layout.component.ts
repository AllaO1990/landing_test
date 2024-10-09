import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TuiBreakpointService } from '@taiga-ui/core';

@Component({
  selector: 'lib-layout',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);
}
