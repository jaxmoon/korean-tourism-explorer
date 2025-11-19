export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

export interface AxiosRequestConfig<T = any> {
  url?: string;
  method?: Method;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: T;
  timeout?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  validateStatus?: (status: number) => boolean;
}

export interface AxiosResponse<T = any, D = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig<D>;
  request?: unknown;
}

export interface AxiosError<T = any, D = any> extends Error {
  config?: AxiosRequestConfig<D>;
  code?: string | null;
  request?: unknown;
  response?: AxiosResponse<T, D>;
  isAxiosError: boolean;
  cause?: unknown;
}

export interface AxiosInterceptorManager<V> {
  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: any) => any
  ): number;
  eject(id: number): void;
}

export interface AxiosInstance {
  defaults: AxiosRequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };

  request<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig<T>): Promise<R>;
  get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig<T>): Promise<R>;
  delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig<T>): Promise<R>;
  head<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig<T>): Promise<R>;
  options<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig<T>): Promise<R>;
  post<T = any, R = AxiosResponse<T>>(url: string, data?: T, config?: AxiosRequestConfig<T>): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(url: string, data?: T, config?: AxiosRequestConfig<T>): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(url: string, data?: T, config?: AxiosRequestConfig<T>): Promise<R>;
}

export interface AxiosStatic extends AxiosInstance {
  create(config?: AxiosRequestConfig): AxiosInstance;
  isAxiosError(payload: any): payload is AxiosError;
  AxiosError: new (
    message: string,
    code?: string | null,
    config?: AxiosRequestConfig,
    request?: unknown,
    response?: AxiosResponse
  ) => AxiosError;
}

declare const axios: AxiosStatic;

export default axios;
export { AxiosRequestConfig, AxiosResponse, AxiosInstance, AxiosError, AxiosStatic };
