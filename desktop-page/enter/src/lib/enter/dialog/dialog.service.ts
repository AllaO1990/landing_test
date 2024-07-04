import { Injectable, Injector } from '@angular/core';
import { AbstractTuiDialogService } from '@taiga-ui/cdk';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { Observable } from 'rxjs';
import { Idea } from 'types/idea';
import { VtEnterComponent } from '../enter.component';
import { EnterDialogComponent } from './dialog.component';

@Injectable()
export class EnterDialogService extends AbstractTuiDialogService<any> {
  protected override component = new PolymorpheusComponent(EnterDialogComponent);

  protected override defaultOptions: any = { data: null };

  public openDialog(data: Idea, injector: Injector): Observable<any> {
    return this.open(new PolymorpheusComponent(VtEnterComponent, injector), {
      data,
    });
  }
}
