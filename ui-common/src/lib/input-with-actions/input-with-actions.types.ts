export interface FormInputEvent<T> {
  type: FormEventEnum;
  value: T;
  changed: string | null;
}

export enum FormEventEnum {
  SUBMIT = 'submit',
  CANCEL = 'cancel',
}
