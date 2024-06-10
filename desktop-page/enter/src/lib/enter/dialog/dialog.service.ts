import { AbstractTuiDialogService } from '@taiga-ui/cdk';
import { Injectable } from '@angular/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { EnterDialogComponent } from './dialog.component';
import { Observable } from 'rxjs';
import { VtEnterComponent } from '../enter.component';

@Injectable({
  providedIn: 'root',
})
export class EnterDialogService extends AbstractTuiDialogService<any> {
  protected override component = new PolymorpheusComponent(
    EnterDialogComponent
  );

  protected override defaultOptions: any = { data: null };

  public openDialog(data: any): Observable<any> {
    return this.open(new PolymorpheusComponent(VtEnterComponent), {
      data,
    });
  }
}
