/**
 * Utilities to parse cookies from 'set-cookie' header in SuperTest Response.
 */
import { assert } from 'chai';
import { IWebDriverCookie as ICookie } from 'selenium-webdriver';
import { Response } from 'supertest';
import {Cookie as ToughCookie} from 'tough-cookie';

interface ICookies<T = ICookie>  { [key: string]: T | undefined; }

/**
 * Parse all cookies from the 'set-cookie' header in the SuperTest Response.
 */
export function parseCookies(res: Response, raw?: false): ICookies;
export function parseCookies(res: Response, raw: true): ICookies<ToughCookie>;
export function parseCookies(res: Response, raw?: boolean): ICookies | ICookies<ToughCookie> {
  function toCookie(c?: ToughCookie) {
    if (!c) {
      return;
    }
    return {
      name: c.key,
      value: c.value,
      path: c.path,
      domain: c.domain,
      secure: c.secure,
      httpOnly: c.httpOnly,
      expiry: c.expiryTime(),
    };
  }

  const cookieHeader: {} = res.header['set-cookie'];
  if (!cookieHeader) {
    return {};
  }

  if (raw) {
    const rawCookies: ICookies<ToughCookie> = {};
    if (Array.isArray(cookieHeader)) {
      for (const cookie of cookieHeader) {
        const c = ToughCookie.parse(String(cookie));
        if (c) {
          rawCookies[c.key] = c;
        }
      }
    } else {
      const c = ToughCookie.parse(String(cookieHeader));
      if (c) {
        rawCookies[c.key] = c;
      }
    }
    return rawCookies;
  }

  const cookies: ICookies = {};
  if (Array.isArray(cookieHeader)) {
    for (const cookie of cookieHeader) {
      const c = toCookie(ToughCookie.parse(cookie));
      if (c) {
        cookies[c.name] = c;
      }
    }
  } else {
    const c = toCookie(ToughCookie.parse(String(cookieHeader)));
    if (c) {
      cookies[c.name] = c;
    }
  }
  return cookies;
}

/**
 * Parse the cookie with the specified name from the 'set-cookie' header in the SuperTest Response.
 */
export function parseCookie(res: Response, name: string, raw?: false): ICookie;
export function parseCookie(res: Response, name: string, raw: true): ToughCookie;
export function parseCookie(res: Response, name: string, raw?: boolean): ICookie | ToughCookie {
  if (raw) {
    const rawCookie = parseCookies(res, raw)[name];
    if (!rawCookie) {
      assert.isDefined(rawCookie, `Cookie not set in response: ${name}`);
      // assert.isDefined() should ALWAYS throw an AssertionError!
      throw new Error('unreachable');
    }
    return rawCookie;
  }

  const cookie = parseCookies(res, raw)[name];
  if (!cookie) {
    assert.isDefined(cookie, `Cookie not set in response: ${name}`);
    // assert.isDefined() should ALWAYS throw an AssertionError!
    throw new Error('unreachable');
  }
  return cookie;
}
