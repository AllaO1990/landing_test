import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, TuiRoot],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'gpn-dev';
}
