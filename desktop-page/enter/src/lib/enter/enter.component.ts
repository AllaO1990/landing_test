import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButtonModule } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialog } from '@taiga-ui/cdk';
import { EnterActionComponent } from './action/action.component';
import { EnterIdeaComponent } from './idea/idea.component';
import { DatePipe } from '@angular/common';
import { EnterSidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'lib-enter',
  standalone: true,
  imports: [
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
  public readonly context: TuiDialog<any, any> = inject(POLYMORPHEUS_CONTEXT, {
    optional: true,
  });

  get data(): any {
    return this.context.data;
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }
}
