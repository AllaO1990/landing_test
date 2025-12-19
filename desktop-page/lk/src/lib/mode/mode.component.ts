import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton, TuiGroup } from '@taiga-ui/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MODE_LIST } from './mode.constants';
import { Router, RouterLink, RouterLinkActive, UrlTree } from '@angular/router';

interface Item {
  name: string;
  value: string;
  path: UrlTree;
}

type Items = Item[];

@Component({
  selector: 'lk-mode',
  imports: [ReactiveFormsModule, TuiGroup, TuiButton, RouterLink, RouterLinkActive],
  templateUrl: './mode.component.html',
  styleUrl: './mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeComponent {
  readonly #router: Router = inject(Router);

  protected readonly size = 's';
  protected readonly list: Items = MODE_LIST.map((item) => ({
    ...item,
    path: this.#router.createUrlTree([item.path]),
  }));
}
