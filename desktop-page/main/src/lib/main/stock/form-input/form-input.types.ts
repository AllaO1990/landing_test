export interface FormInputEvent<T> {
  type: 'submit' | 'cancel';
  value: T;
  changed: string | null;
}
