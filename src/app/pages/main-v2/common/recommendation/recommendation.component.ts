import {ChangeDetectionStrategy, Component, ContentChild, Input} from '@angular/core';
import {RecommendationHeaderDirective, RecommendationItemDirective} from "./recommendation.directive";

@Component({
  selector: 'vt-recommendation',
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationComponent {

  @Input() data: any[] = [];

  @Input() itemSize = 32;

  @ContentChild(RecommendationItemDirective) public item: RecommendationItemDirective | null = null;
  @ContentChild(RecommendationHeaderDirective) public header: RecommendationHeaderDirective | null = null;

  constructor() {
  }

  public trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
