import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VtInputDirective } from './input.directive';
import { VtFormFieldModule } from '../form-field/form-field.module';

@NgModule({
  declarations: [VtInputDirective],
  imports: [CommonModule, VtFormFieldModule],
  exports: [VtInputDirective, VtFormFieldModule],
})
export class VtInputModule {}
