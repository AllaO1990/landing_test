import { TuiPopoverService } from '@taiga-ui/cdk';
import { Injectable } from '@angular/core';
import { EnterDialogComponent } from './dialog.component';
import { TUI_DIALOGS } from '@taiga-ui/core';

@Injectable({
  providedIn: 'any',
  useFactory: () => new EnterDialogService(TUI_DIALOGS, EnterDialogComponent),
})
export class EnterDialogService extends TuiPopoverService<any, any> {}
