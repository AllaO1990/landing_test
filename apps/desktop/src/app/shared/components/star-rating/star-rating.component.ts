import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'vt-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vt-star-ratings',
  },
})
export class VtStarRatingComponent implements OnInit {
  @Input()
  set rating(value: number) {
    this._rating = value;
  }

  get rating(): number {
    const ratingPercent = this._rating / (5 / 100);
    return ratingPercent > 100 ? 100 : ratingPercent;
  }

  private _rating = 0;

  @Input() starsCount = 5;

  _starsArray = Array(this.starsCount);

  constructor() {}

  ngOnInit(): void {}
}
