import { NgModule } from '@angular/core';
import { PolymorpheusModule } from '@tinkoff/ng-polymorpheus';
import { EnterDialogComponent } from './dialog.component';
import { JsonPipe } from '@angular/common';
import { TuiButtonModule } from '@taiga-ui/core';

@NgModule({
  declarations: [EnterDialogComponent],
  imports: [PolymorpheusModule, TuiButtonModule, JsonPipe],
  providers: [],
  exports: [EnterDialogComponent],
})
export class EnterDialogModule {}
