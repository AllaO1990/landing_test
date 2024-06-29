import { AbstractTuiDialogService } from '@taiga-ui/cdk';
import { Injectable, Injector } from '@angular/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { EnterDialogComponent } from './dialog.component';
import { Observable } from 'rxjs';
import { VtEnterComponent } from '../enter.component';
import { Idea } from 'types/idea';

@Injectable({
  providedIn: 'root',
})
export class EnterDialogService extends AbstractTuiDialogService<any> {
  protected override component = new PolymorpheusComponent(
    EnterDialogComponent
  );

  protected override defaultOptions: any = { data: null };

  public openDialog(data: Idea, injector: Injector): Observable<any> {
    return this.open(new PolymorpheusComponent(VtEnterComponent, injector), {
      data,
    });
  }
}
