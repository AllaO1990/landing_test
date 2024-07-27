export interface Response<T> {
  data: T;
  message: string;
  success: boolean;
}

export enum ResponseMessage {
  success = 'Success',
}
