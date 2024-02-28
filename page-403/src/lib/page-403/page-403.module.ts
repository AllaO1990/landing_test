import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageComponent } from './page/page.component';
import { Page403RoutingModule } from './page-403-routing.module';
import { PageClientErrorModule } from '@ui/page-client-error';

@NgModule({
  declarations: [PageComponent],
  imports: [CommonModule, Page403RoutingModule, PageClientErrorModule],
})
export class Page403Module {}
