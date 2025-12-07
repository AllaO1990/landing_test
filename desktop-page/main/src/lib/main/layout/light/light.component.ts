import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { IdeaListWrapper } from '@feat-idea-list';
import { StructureWrapper } from '@feat-structure';
import { DialListWrapper } from '@feat-deal-list';

@Component({
  selector: 'main-light',
  standalone: true,
  imports: [StructureWrapper, IdeaListWrapper, DialListWrapper],
  templateUrl: './light.component.html',
  styleUrl: './light.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
  }
}
