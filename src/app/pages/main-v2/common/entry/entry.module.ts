import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EntryComponent} from './entry.component';
import {RecommendationModule} from "../recommendation/recommendation.module";
import {IdeaComponent} from "./idea/idea.component";


@NgModule({
  declarations: [
    EntryComponent,
    IdeaComponent
  ],
  imports: [
    CommonModule,
    RecommendationModule,
  ],
  exports: [
    EntryComponent
  ]
})
export class EntryModule {
}
