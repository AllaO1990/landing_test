import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'vt-toolbar-start',
  templateUrl: './toolbar-start.component.html',
  styleUrls: ['./toolbar-start.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarStartComponent implements OnInit {
  public readonly links: { path: string[]; name: string }[] = [
    { name: 'Sign in', path: ['/login'] },
    { name: 'Sign up', path: ['/registration'] },
  ];

  constructor() {}

  ngOnInit(): void {}

  public trackByIndex(index: number): number {
    return index;
  }
}
