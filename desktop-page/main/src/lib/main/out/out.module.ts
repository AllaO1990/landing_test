import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutComponent } from './out.component';
import { IdeaComponent } from './idea/idea.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  TuiFormatNumberPipeModule,
  TuiLoaderModule,
  TuiScrollbarModule
} from '@taiga-ui/core';

@NgModule({
  declarations: [OutComponent, IdeaComponent],
  imports: [
    CommonModule,
    ScrollingModule,
    TuiTableModule,
    TuiLoaderModule,
    TuiScrollbarModule,
    TuiFormatNumberPipeModule
  ],
  exports: [OutComponent]
})
export class OutModule {
}
