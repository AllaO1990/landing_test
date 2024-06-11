import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiInputDateModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiTextfieldControllerModule } from '@taiga-ui/core';

@Component({
  selector: 'lib-enter-sidebar',
  standalone: true,
  imports: [
    TuiInputDateModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent {
  @Input() data: any;
}
