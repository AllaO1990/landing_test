import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'idea-list-wrapper',
  standalone: true,
  imports: [LayoutComponent],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaListWrapper {}
