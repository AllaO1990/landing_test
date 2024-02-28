import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, ReplaySubject, Subject, takeWhile, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'vt-page-401',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent implements AfterViewInit, OnDestroy {
  @Input() time = 15;

  public timeOut: number | null = null;

  private readonly _destroyed$: Subject<void> = new ReplaySubject<void>(1);

  constructor(
    @Inject(Router) private readonly _router: Router,
    @Inject(ChangeDetectorRef) private readonly _cdr: ChangeDetectorRef
  ) {}

  private initTimer(time: number): void {
    if (this.time <= 0) {
      return;
    }

    timer(0, 1000)
      .pipe(
        takeUntil(this._destroyed$),
        takeWhile((value: number) => value <= this.time),
        map((value: number) => time - value),
        finalize(() => console.log('finalize'))
      )
      .subscribe((result: number) => {
        if (result === 0) {
          this._router.navigate(['/']);
        }

        this.timeOut = result;
        this._cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.initTimer(this.time);
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
