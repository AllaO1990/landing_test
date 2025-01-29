import { DestroyRef, Directive, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { DESKTOP_API } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Response } from 'types/response';
import { forkJoin, timer } from 'rxjs';
import { map } from 'rxjs/operators';

@Directive({
  selector: '[libEnterSubscribe]',
  standalone: true,
})
export class EnterIdeaSubscribeDirective {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #api: DesktopService = inject(DESKTOP_API);

  @Input() ideaId: string | number | null = null;

  @Input() isSubscribe: boolean | null = true;

  @Output() isSubscribeChanged: EventEmitter<boolean | null> = new EventEmitter<boolean | null>();

  @HostListener('click', ['$event']) onClick(event: Event): void {
    event.preventDefault();

    if (this.ideaId === null) {
      this._setStatus(!this.isSubscribe);

      return;
    }

    if (this.isSubscribe === null) {
      return;
    }

    if (this.isSubscribe) {
      this._setStatus(null);
      forkJoin({
        timer: timer(500),
        api: this.#api.setUnsubscribe(+this.ideaId),
      })
        .pipe(
          takeUntilDestroyed(this.#destroyRef),
          map((response: { api: Response<{ subscribed: boolean }> }) => response.api.data.subscribed)
        )
        .subscribe((result: boolean) => {
          this._setStatus(result);
        });

      return;
    }

    this._setStatus(null);
    forkJoin({
      timer: timer(500),
      api: this.#api.setSubscribe(+this.ideaId),
    })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        map((response: { api: Response<{ subscribed: boolean }> }) => response.api.data.subscribed)
      )
      .subscribe((result: boolean) => {
        this._setStatus(result);
      });
  }

  private _setStatus(status: boolean | null): void {
    this.isSubscribe = status;
    this.isSubscribeChanged.emit(this.isSubscribe);
  }
}
