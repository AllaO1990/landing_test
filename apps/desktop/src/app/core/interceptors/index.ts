// Injection token for the Http Interceptors multi-provider
import { authenticationInterceptor } from './auth.interceptor';
import { credentialsInterceptor } from './credentials.interceptor';
import { responseInterceptor } from './response.interceptor';
import { paymentInterceptor } from './payment.interceptor';

export const httpInterceptors = [
  authenticationInterceptor,
  credentialsInterceptor,
  responseInterceptor,
  paymentInterceptor,
];
