import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { VtFormFieldControl } from './form-field-control';
import { VT_PREFIX, VtPrefixDirective } from './prefix';
import { VT_SUFFIX, VtSuffixDirective } from './suffix';

@Component({
  selector: 'vt-form-field',
  templateUrl: 'form-field.component.html',
  styleUrls: ['form-field.component.scss', 'form-field-input.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vt-form-field',
  },
})
export class VtFormFieldComponent
  implements OnInit, AfterContentInit, OnDestroy
{
  private readonly _destroyed = new Subject<void>();

  @ContentChildren(VT_PREFIX, { descendants: true })
  _prefixChildren!: QueryList<VtPrefixDirective>;

  @ContentChildren(VT_SUFFIX, { descendants: true })
  _suffixChildren!: QueryList<VtSuffixDirective>;

  @ContentChild(VtFormFieldControl) _controlNonStatic!: VtFormFieldControl;
  @ContentChild(VtFormFieldControl, { static: true })
  _controlStatic!: VtFormFieldControl;

  get _control() {
    return (
      this._explicitFormFieldControl ||
      this._controlNonStatic ||
      this._controlStatic
    );
  }

  set _control(value) {
    this._explicitFormFieldControl = value;
  }

  private _explicitFormFieldControl!: VtFormFieldControl;

  constructor(
    public _elementRef: ElementRef,
    private _cdr: ChangeDetectorRef
  ) {}

  ngAfterContentInit() {
    const control = this._control;

    this._control.stateChanges.pipe(startWith(null)).subscribe(() => {
      this._cdr.markForCheck();
    });

    if (control.ngControl && control.ngControl.valueChanges) {
      control.ngControl.valueChanges
        .pipe(takeUntil(this._destroyed))
        .subscribe(() => this._cdr.markForCheck());
    }
  }

  ngOnInit() {}

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
