export interface Response<T> {
  data: T;
  message: ResponseMessage;
  success: boolean;
}

export enum ResponseMessage {
  success = 'Success',
}
