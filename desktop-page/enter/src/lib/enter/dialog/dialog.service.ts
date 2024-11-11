import { TuiPopoverService } from "@taiga-ui/cdk";
import { Injectable, Injector } from '@angular/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { Observable } from 'rxjs';
import { VtEnterComponent } from '../enter.component';
import { EnterDialogComponent } from './dialog.component';
import { EventSelected } from 'types/events';

@Injectable()
export class EnterDialogService extends TuiPopoverService<any> {
  protected override component = new PolymorpheusComponent(EnterDialogComponent);

  protected override defaultOptions: any = { data: null };

  public openDialog<T>(data: { data: T; type: EventSelected }, injector: Injector): Observable<void> {
    return this.open(new PolymorpheusComponent(VtEnterComponent, injector), {
      data,
    });
  }
}
