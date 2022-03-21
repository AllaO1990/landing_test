import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { VtFormFieldModule } from '../form-field/form-field.module';
import { VtInputDirective } from './input.directive';

@NgModule({
  declarations: [VtInputDirective],
  imports: [CommonModule, VtFormFieldModule],
  exports: [VtInputDirective, VtFormFieldModule],
})
export class VtInputModule {}
