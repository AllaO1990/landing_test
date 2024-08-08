import { NgModule } from '@angular/core';
import { TuiButtonModule } from '@taiga-ui/core';
import { PolymorpheusModule } from '@tinkoff/ng-polymorpheus';
import { EnterDialogComponent } from './dialog.component';

@NgModule({
  declarations: [EnterDialogComponent],
  imports: [PolymorpheusModule, TuiButtonModule],
  providers: [],
  exports: [EnterDialogComponent],
})
export class EnterDialogModule {}
