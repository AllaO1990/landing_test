import { CommonModule, NgIf } from '@angular/common';
import { NgModule } from '@angular/core';
import { VtFormFieldComponent } from './form-field.component';
import { VtPrefixDirective } from './prefix';
import { VtSuffixDirective } from './suffix';

@NgModule({
  imports: [NgIf],
  exports: [VtFormFieldComponent, VtSuffixDirective, VtPrefixDirective],
  declarations: [VtFormFieldComponent, VtSuffixDirective, VtPrefixDirective],
  providers: [],
})
export class VtFormFieldModule {}
