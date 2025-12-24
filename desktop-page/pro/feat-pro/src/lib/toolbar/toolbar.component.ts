import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavComponent } from '../nav';
import { LocalStorage } from 'storage/local.storage';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';

@Component({
  selector: 'pro-toolbar',
  imports: [NavComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarProComponent implements AfterViewInit {
  readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);

  ngAfterViewInit(): void {
    this.#localStorage.setItem('mode', 'pro');
  }
}
