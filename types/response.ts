export interface Response<T> {
  data: T;
  message: 'Success';
  success: boolean;
}
