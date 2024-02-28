import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageComponent } from './page/page.component';
import { Page404RoutingModule } from './page-404-routing.module';
import { PageClientErrorModule } from '../../shared/components/page-client-error';

@NgModule({
  declarations: [PageComponent],
  imports: [CommonModule, Page404RoutingModule, PageClientErrorModule],
})
export class Page404Module {}
