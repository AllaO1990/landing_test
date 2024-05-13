import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  Directive,
  DoCheck,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Self,
} from '@angular/core';
import { FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { VtFormFieldControl } from '../form-field/form-field-control';
import { VT_INPUT_VALUE_ACCESSOR } from './input-value-accessor';

let nextUniqueId = 0;

@Directive({
  selector: 'input[vtInput]',
  exportAs: 'vtInput',
  providers: [{ provide: VtFormFieldControl, useExisting: VtInputDirective }],
  host: {
    class: 'vt-input-element',
    '[attr.id]': 'id',
    '[required]': 'required',
    '[attr.readonly]': 'readonly || null',
    '(input)': '_onInput()',
  },
})
export class VtInputDirective
  implements VtFormFieldControl, OnInit, OnChanges, DoCheck, OnDestroy
{
  protected _uid = `vt-input-${nextUniqueId++}`;
  protected _previousNativeValue!: any;
  private _inputValueAccessor: any;

  readonly stateChanges: Subject<void> = new Subject<void>();

  focused: boolean = false;
  empty: boolean = false;
  errorState: boolean = false;

  @Input()
  get value(): string {
    return this._inputValueAccessor.value;
  }

  set value(value: string) {
    if (value !== this.value) {
      this._inputValueAccessor.value = value;
      this.stateChanges.next();
    }
  }

  @Input()
  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value || 'text';
  }

  protected _type = 'text';

  @Input()
  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value || this._uid;
  }

  protected _id!: string;

  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }

  protected _required = false;

  @Input()
  get readonly(): boolean {
    return this._readonly;
  }

  set readonly(value: boolean) {
    this._readonly = coerceBooleanProperty(value);
  }

  private _readonly = false;

  @Input()
  get disabled(): boolean {
    if (this.ngControl && this.ngControl.disabled !== null) {
      return this.ngControl.disabled;
    }
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);

    if (this.focused) {
      this.focused = false;
      this.stateChanges.next();
    }
  }

  protected _disabled = false;

  @Input() placeholder!: string;

  constructor(
    protected _elementRef: ElementRef<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    @Optional() @Self() public ngControl: NgControl,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    @Optional() @Self() @Inject(VT_INPUT_VALUE_ACCESSOR) inputValueAccessor: any
  ) {
    const element = this._elementRef.nativeElement;

    this.id = this.id;

    this._inputValueAccessor = inputValueAccessor || element;

    this._previousNativeValue = this.value;
  }

  ngOnChanges() {
    this.stateChanges.next();
  }

  ngDoCheck() {
    this._dirtyCheckNativeValue();
  }

  ngOnInit(): void {}

  @HostListener('focus', ['true'])
  @HostListener('blur', ['false'])
  // tslint:enable:no-host-decorator-in-concrete
  _focusChanged(isFocused: boolean) {
    if (isFocused !== this.focused && (!this.readonly || !isFocused)) {
      this.focused = isFocused;
      this.stateChanges.next();
    }
  }

  focus(): void {
    this._elementRef.nativeElement.focus();
  }

  onContainerClick(event: MouseEvent) {
    if (!this.focused) {
      this.focus();
    }
  }

  _onInput() {
    // This is a noop function and is used to let Angular know whenever the value changes.
    // Angular will run a new change detection each time the `input` event has been dispatched.
    // It's necessary that Angular recognizes the value change, because when floatingLabel
    // is set to false and Angular forms aren't used, the placeholder won't recognize the
    // value changes and will not disappear.
    // Listening to the input event wouldn't be necessary when the input is using the
    // FormsModule or ReactiveFormsModule, because Angular forms also listens to input events.
  }

  protected _dirtyCheckNativeValue() {
    const newValue = this._elementRef.nativeElement.value;

    if (this._previousNativeValue !== newValue) {
      this._previousNativeValue = newValue;
      this.stateChanges.next();
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }

  static ngAcceptInputType_disabled: BooleanInput;
  static ngAcceptInputType_readonly: BooleanInput;
  static ngAcceptInputType_required: BooleanInput;

  // Accept `any` to avoid conflicts with other directives on `<input>` that may
  // accept different types.
  static ngAcceptInputType_value: any;
}
