import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { TuiDialogModule, TuiModeModule, TuiRootModule } from '@taiga-ui/core';
import { TUI_DIALOGS } from '@taiga-ui/cdk';
import { EnterDialogService } from 'desktop-page/enter';
import { DialogService } from '@ui/components/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, TuiRootModule, MatNativeDateModule, TuiModeModule, TuiDialogModule],
  providers: [
    {
      provide: TUI_DIALOGS,
      useExisting: EnterDialogService,
      multi: true,
    },
    EnterDialogService,
    {
      provide: TUI_DIALOGS,
      useExisting: DialogService,
      multi: true,
    },
    DialogService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'gpn-dev';
}
