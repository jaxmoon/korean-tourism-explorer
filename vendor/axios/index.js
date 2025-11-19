/* eslint-disable @typescript-eslint/no-var-requires */
const DEFAULT_HEADERS = {
  Accept: 'application/json, text/plain, */*',
};

class AxiosError extends Error {
  constructor(message, code, config, request, response, cause) {
    super(message);
    this.name = 'AxiosError';
    this.code = code;
    this.config = config;
    this.request = request;
    this.response = response;
    this.cause = cause;
    this.isAxiosError = true;
  }
}

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  use(fulfilled, rejected) {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  forEach(fn) {
    this.handlers.forEach((handler) => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }
}

const methodsNoData = ['delete', 'get', 'head', 'options'];
const methodsWithData = ['post', 'put', 'patch'];

class AxiosInstance {
  constructor(defaultConfig = {}) {
    this.defaults = {
      headers: {},
      validateStatus: defaultValidateStatus,
      ...defaultConfig,
    };
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  request(configOrUrl, config) {
    let requestConfig =
      typeof configOrUrl === 'string'
        ? { ...(config || {}), url: configOrUrl }
        : { ...(configOrUrl || {}) };

    requestConfig = mergeConfig(this.defaults, requestConfig);

    const requestHandlers = [];
    this.interceptors.request.forEach((handler) => {
      requestHandlers.unshift(handler);
    });

    const responseHandlers = [];
    this.interceptors.response.forEach((handler) => {
      responseHandlers.push(handler);
    });

    let promise = Promise.resolve(requestConfig);

    requestHandlers.forEach(({ fulfilled, rejected }) => {
      if (fulfilled || rejected) {
        promise = promise.then(fulfilled, rejected);
      }
    });

    promise = promise.then((finalConfig) => dispatchRequest(finalConfig));

    responseHandlers.forEach(({ fulfilled, rejected }) => {
      if (fulfilled || rejected) {
        promise = promise.then(fulfilled, rejected);
      }
    });

    return promise;
  }
}

methodsNoData.forEach((method) => {
  AxiosInstance.prototype[method] = function axiosMethod(url, config) {
    return this.request({ ...(config || {}), method, url });
  };
});

methodsWithData.forEach((method) => {
  AxiosInstance.prototype[method] = function axiosDataMethod(url, data, config) {
    return this.request({ ...(config || {}), method, url, data });
  };
});

function defaultValidateStatus(status) {
  return status >= 200 && status < 300;
}

function mergeConfig(defaults, config) {
  const merged = {
    ...defaults,
    ...config,
    headers: {
      ...(defaults.headers || {}),
      ...(config.headers || {}),
    },
  };

  if (!merged.method && defaults.method) {
    merged.method = defaults.method;
  }

  return merged;
}

function buildURL(baseURL = '', url = '', params) {
  const base = baseURL ? new URL(baseURL) : null;
  let finalURL;
  if (base) {
    finalURL = new URL(url || '', base);
  } else {
    finalURL = new URL(url || '', 'http://localhost');
  }

  if (params) {
    const searchParams = new URLSearchParams(finalURL.search);
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, formatParamValue(item)));
      } else {
        searchParams.set(key, formatParamValue(value));
      }
    });
    finalURL.search = searchParams.toString();
  }

  if (base) {
    return finalURL.toString();
  }

  // When baseURL is missing, URL will include dummy origin which we strip out
  return finalURL.pathname + finalURL.search;
}

function formatParamValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

async function dispatchRequest(config) {
  const requestUrl = buildURL(config.baseURL, config.url, config.params);
  const method = (config.method || 'get').toUpperCase();
  const headers = normalizeHeaders({ ...DEFAULT_HEADERS, ...(config.headers || {}) });

  let body = config.data;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  ) {
    body = JSON.stringify(body);
    if (!('content-type' in lowerCaseKeys(headers))) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const controller = new AbortController();
  let timeoutId;
  if (config.timeout && config.timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), config.timeout);
  }

  try {
    const response = await fetch(requestUrl, {
      method,
      headers,
      body: body === undefined ? undefined : body,
      signal: controller.signal,
    });

    const axiosResponse = {
      data: await parseResponseData(response, config.responseType),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: null,
    };

    const validateStatus = config.validateStatus || defaultValidateStatus;
    if (!validateStatus(response.status)) {
      throw createAxiosError(
        `Request failed with status code ${response.status}`,
        config,
        null,
        null,
        axiosResponse
      );
    }

    return axiosResponse;
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw createAxiosError(
        `timeout of ${config.timeout}ms exceeded`,
        config,
        'ECONNABORTED',
        null,
        null,
        error
      );
    }

    if (isAxiosError(error)) {
      throw error;
    }

    throw createAxiosError(
      error && error.message ? error.message : 'Network Error',
      config,
      'ERR_NETWORK',
      null,
      null,
      error
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function normalizeHeaders(headers) {
  const normalized = {};
  Object.keys(headers).forEach((key) => {
    const value = headers[key];
    if (value !== undefined) {
      normalized[key] = value;
    }
  });
  return normalized;
}

function lowerCaseKeys(obj) {
  const lowered = {};
  Object.keys(obj).forEach((key) => {
    lowered[key.toLowerCase()] = obj[key];
  });
  return lowered;
}

async function parseResponseData(response, responseType) {
  if (responseType === 'arraybuffer') {
    return response.arrayBuffer();
  }
  if (responseType === 'blob') {
    return response.blob();
  }
  if (responseType === 'stream') {
    return response.body;
  }
  if (responseType === 'text') {
    return response.text();
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  }

  return response.text();
}

function createAxiosError(message, config, code, request, response, cause) {
  return new AxiosError(message, code, config, request, response, cause);
}

function isAxiosError(error) {
  return (
    error instanceof AxiosError ||
    Boolean(error && error.isAxiosError)
  );
}

function createAxios(defaultConfig) {
  const context = new AxiosInstance(defaultConfig);
  const instance = context.request.bind(context);

  Object.setPrototypeOf(instance, AxiosInstance.prototype);

  instance.request = context.request.bind(context);
  instance.get = context.get.bind(context);
  instance.delete = context.delete.bind(context);
  instance.head = context.head.bind(context);
  instance.options = context.options.bind(context);
  instance.post = context.post.bind(context);
  instance.put = context.put.bind(context);
  instance.patch = context.patch.bind(context);
  instance.defaults = context.defaults;
  instance.interceptors = context.interceptors;

  return instance;
}

const axios = createAxios({});

axios.create = function create(config) {
  return createAxios(config || {});
};

axios.isAxiosError = isAxiosError;
axios.AxiosError = AxiosError;

module.exports = axios;
module.exports.default = axios;
