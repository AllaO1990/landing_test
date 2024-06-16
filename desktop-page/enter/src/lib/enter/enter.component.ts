import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButtonModule, TuiLoaderModule } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialog } from '@taiga-ui/cdk';
import { EnterActionComponent } from './action/action.component';
import { EnterIdeaComponent } from './idea/idea.component';
import { DatePipe, JsonPipe, NgIf } from '@angular/common';
import { EnterSidebarComponent } from './sidebar/sidebar.component';
import { Idea } from 'types/idea';

@Component({
  selector: 'lib-enter',
  standalone: true,
  imports: [
    NgIf,
    JsonPipe,
    TuiLoaderModule,
    TuiButtonModule,
    EnterActionComponent,
    EnterIdeaComponent,
    EnterSidebarComponent,
    DatePipe,
  ],
  templateUrl: './enter.component.html',
  styleUrl: './enter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VtEnterComponent {
  public readonly context: TuiDialog<any, Idea> = inject(POLYMORPHEUS_CONTEXT, {
    optional: true,
  });

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }
}
