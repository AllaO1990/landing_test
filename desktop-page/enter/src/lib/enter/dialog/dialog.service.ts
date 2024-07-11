import { Injectable, Injector } from '@angular/core';
import { AbstractTuiDialogService } from '@taiga-ui/cdk';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { Observable } from 'rxjs';
import { VtEnterComponent } from '../enter.component';
import { EnterDialogComponent } from './dialog.component';
import { EventSelected } from 'types/events';

@Injectable()
export class EnterDialogService extends AbstractTuiDialogService<any> {
  protected override component = new PolymorpheusComponent(EnterDialogComponent);

  protected override defaultOptions: any = { data: null };

  public openDialog<T>(data: { data: T; type: EventSelected }, injector: Injector): Observable<void> {
    return this.open(new PolymorpheusComponent(VtEnterComponent, injector), {
      data,
    });
  }
}
