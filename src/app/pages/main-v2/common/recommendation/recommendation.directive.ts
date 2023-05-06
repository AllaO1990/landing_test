import {Directive, Inject, TemplateRef, ViewContainerRef} from "@angular/core";
import {CdkVirtualForOfContext} from "@angular/cdk/scrolling";

@Directive({
  selector: '[recommendationItem]'
})
export class RecommendationItemDirective {
  constructor(
    @Inject(ViewContainerRef) public readonly vcRef: ViewContainerRef,
    @Inject(TemplateRef) public readonly temRef: TemplateRef<CdkVirtualForOfContext<any>>,
  ) {
  }
}

@Directive({
  selector: '[recommendationHeader]'
})
export class RecommendationHeaderDirective {
  constructor(
    @Inject(ViewContainerRef) public readonly vcRef: ViewContainerRef,
    @Inject(TemplateRef) public readonly temRef: TemplateRef<CdkVirtualForOfContext<any>>,
  ) {
  }
}
