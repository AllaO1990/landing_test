import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiAvatar } from '@taiga-ui/kit';

@Component({
  selector: 'lk-user',
  imports: [TuiAvatar],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {}
