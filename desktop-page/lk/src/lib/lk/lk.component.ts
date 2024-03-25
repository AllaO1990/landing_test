import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarSearchModule } from '../../../../../apps/desktop/src/app/shared/components/toolbar-search';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';

@Component({
  selector: 'lib-lk',
  standalone: true,
  imports: [RouterOutlet, ToolbarSearchModule],
  templateUrl: './lk.component.html',
  styleUrl: './lk.component.scss',
  providers: [
    {
      provide: DESKTOP_STORE,
      useClass: DesktopLkStore,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent {}
