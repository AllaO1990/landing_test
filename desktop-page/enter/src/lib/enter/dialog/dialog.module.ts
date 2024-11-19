import { PolymorpheusTemplate, PolymorpheusOutlet } from "@taiga-ui/polymorpheus";
import { TuiButton } from "@taiga-ui/core";
import { NgModule } from '@angular/core';
import { EnterDialogComponent } from './dialog.component';

@NgModule({
  declarations: [EnterDialogComponent],
  imports: [PolymorpheusTemplate, PolymorpheusOutlet, TuiButton],
  providers: [],
  exports: [EnterDialogComponent],
})
export class EnterDialogModule {}
