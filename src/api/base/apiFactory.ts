import { isNil } from 'lodash';

import createClient from 'openapi-fetch';
import { getBuildNumber, getVersion } from 'react-native-device-info';

import { getApiKey } from '@/secureStore/domains/apiKey';

import BackendConfigurator from './BackendConfigurator';
import { fetchClient } from './fetchClient';

import type { ErrorResult } from '../types';
import type { BodySerializer, FetchOptions, HeadersOptions, QuerySerializer } from 'openapi-fetch';

import type { FilterKeys, PathItemObject, PathsWithMethod } from 'openapi-typescript-helpers';

import { HARMONY_CF_CLIENT_ID, HARMONY_CF_CLIENT_SECRET } from '/config';
import type { paths as groundcontrolPaths } from '/generated/groundcontrol';
import type { paths as harmonyPaths } from '/generated/harmony';
import { getIanaLanguage } from '/loc';

class APIFetchError extends Error {
  constructor(
    readonly original: Error,
    readonly requestId: string,
  ) {
    super(original.message);
  }

  toJSON() {
    return {
      message: this.message,
      requestId: this.requestId,
      stack: this.original.stack,
    };
  }
}

export class APIResponseError extends Error {
  constructor(
    url: string,
    readonly response?: Response,
    readonly errorContent?: ErrorResult,
  ) {
    const message = `"${url}" returned an error: ${JSON.stringify(errorContent)}`;
    super(message);
  }

  toJSON() {
    return {
      message: this.message,
      requestId: this.response?.headers.get('x-request-id'),
      content: this.errorContent,
    };
  }
}

function makeFetchAPI() {
  const fetchApi = async function (request: RequestInfo, _init: RequestInit | undefined) {
    if (typeof request !== 'string') {
      throw new Error('first argument of fetch needs to be a string in our wrapper');
    }
    const url = request;

    const init = _init || {};

    const headers = new Headers(init.headers);
    init.headers = headers;

    Object.entries(getHarmonyHeaders(url)).forEach(([key, value]) => {
      if (value) {
        headers.set(key, value);
      }
    });

    if (url.indexOf('/pow/') === -1) {
      const apiKey = await getApiKey();
      headers.set('Authorization', apiKey);
    }

    const requestId = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0'),
    ).join('');
    headers.set('x-request-id', requestId);

    headers.set('x-client-version', `${getVersion()}-${getBuildNumber()}`);

    try {
      return await fetchClient(request, init);
    } catch (e) {
      throw new APIFetchError(e as Error, requestId);
    }
  };

  return fetchApi;
}

interface ClientOptions extends Omit<RequestInit, 'headers'> {
  baseUrl?: string;
  fetch?: typeof fetch;
  querySerializer?: QuerySerializer<unknown>;
  bodySerializer?: BodySerializer<unknown>;
  headers?: HeadersOptions;
}

export default function createThrowingClient<Paths extends Record<string, PathItemObject>>(clientOptions: ClientOptions = {}) {
  const client = createClient<Paths>(clientOptions);
  return {
    async GET<P extends PathsWithMethod<Paths, 'get'>>(url: P, init: FetchOptions<FilterKeys<Paths[P], 'get'>>) {
      const { data, error, response } = await client.GET(url, init);
      if (error || data === undefined) {
        throw new APIResponseError(url.toString(), response, error as ErrorResult);
      }
      return data;
    },
    async POST<P extends PathsWithMethod<Paths, 'post'>>(url: P, init: FetchOptions<FilterKeys<Paths[P], 'post'>>) {
      const { data, error, response } = await client.POST(url, init);
      if (error || data === undefined) {
        throw new APIResponseError(url.toString(), response, error as ErrorResult);
      }
      return data;
    },
  };
}

function getHarmonyHeaders(url: string) {
  switch (true) {
    case url.startsWith('https://wallet'):
      return {
        'Accept-Language': getIanaLanguage(),
      };
    case url.startsWith('https://pp-wallet'): {
      return {
        'CF-Access-Client-Id': HARMONY_CF_CLIENT_ID,
        'CF-Access-Client-Secret': HARMONY_CF_CLIENT_SECRET,
        'Accept-Language': getIanaLanguage(),
      };
    }
    default:
      return {};
  }
}

export async function getGroundControl() {
  /* @ts-expect-error Generated types don't fit. (Inferrence still works.) */
  return createThrowingClient<groundcontrolPaths>({
    baseUrl: await BackendConfigurator.getGroundcontrolBaseUri(),
    fetch: makeFetchAPI(),
  });
}

export async function getHarmony() {
  const fetch = makeFetchAPI();

  /* @ts-expect-error Generated types don't fit. (Inferrence still works.) */
  const harmony = createThrowingClient<harmonyPaths>({
    baseUrl: await BackendConfigurator.getHarmonyBaseUri(),
    fetch,
    querySerializer: queryParams => {
      const entries = Object.entries(queryParams);
      let s = '';
      entries.forEach(([k, v], i) => {
        if (isNil(v)) {
          return;
        }
        if (typeof v === 'string') {
          v = encodeURIComponent(v as string);
        }
        if (Array.isArray(v)) {
          for (const arrayItem of v) {
            s += i === entries.length - 1 ? `${k}=${arrayItem}` : `${k}=${arrayItem}&`;
          }
        } else {
          s += i === entries.length - 1 ? `${k}=${v}` : `${k}=${v}&`;
        }
      });
      return s;
    },
  });

  return harmony;
}

/* @ts-expect-error Generated types don't fit. (Inferrence still works.) */
export type DefaultApi = ReturnType<typeof createThrowingClient<harmonyPaths>>;
