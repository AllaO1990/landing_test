import { InjectionToken } from '@angular/core';
import { TUI_DIALOGS } from '@taiga-ui/core';
import { DialogService } from './dialog.service';
import { DialogComponent } from './dialog.component';

export const DIALOG = new InjectionToken<DialogService>('Dialog', {
  factory: () => new DialogService(TUI_DIALOGS, DialogComponent),
});
