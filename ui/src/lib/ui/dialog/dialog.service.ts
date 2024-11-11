import { TuiPopoverService } from "@taiga-ui/cdk";
import { Injectable } from '@angular/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { Observable } from 'rxjs';
import { DialogComponent } from './dialog.component';

@Injectable()
export class DialogService extends TuiPopoverService<any> {
  protected override component = new PolymorpheusComponent(DialogComponent);

  protected override defaultOptions: any = { data: null };

  public openDialog<T>(data: T, component: PolymorpheusComponent<any>): Observable<void> {
    return this.open(component, {
      data,
    });
  }
}
