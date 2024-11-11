import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, TuiRoot],
  // providers: [
  //   {
  //     provide: TUI_DIALOGS,
  //     useExisting: EnterDialogService,
  //     multi: true,
  //   },
  //   EnterDialogService,
  //   {
  //     provide: TUI_DIALOGS,
  //     useExisting: DialogService,
  //     multi: true,
  //   },
  //   DialogService,
  // ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'gpn-dev';
}
