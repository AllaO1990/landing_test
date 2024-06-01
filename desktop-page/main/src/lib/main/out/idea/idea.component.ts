import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { IdeaType } from './idea.types';

@Component({
  selector: 'vt-idea',
  templateUrl: './idea.component.html',
  styleUrls: ['./idea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaComponent implements OnInit {
  @Input() data!: IdeaType;

  constructor() {}

  ngOnInit(): void {}
}
