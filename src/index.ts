/**
 * @license
 * Copyright © 2025 rsooio <i@rsoo.io>
 * This work is free. You can redistribute it and/or modify it under the
 * terms of the Do What The Fuck You Want To Public License, Version 2,
 * as published by Sam Hocevar. See the COPYING file for more details.
 */

declare const noExpand: unique symbol;
type NoExpand<T> = T & { [noExpand]?: never };

type Defined<T> = T extends undefined ? never : T;

type Defer<T> = Promise<Awaited<T>> & {
  fmap<U>(fn: (value: Awaited<T>) => U): Deferred<U>;
};

type Deferred<T> = NoExpand<
  Defined<T> extends (...args: infer Args) => infer Ret
    ? (...args: Args) => Deferred<Awaited<Ret>> & Defer<Ret>
    : Defined<T> extends Array<infer U>
    ? DeferredArray<U> & Defer<T>
    : Defined<T> extends object
    ? { [K in keyof Defined<T>]: Deferred<Defined<T>[K]> } & Defer<T>
    : Defer<T>
>;

type DeferredArray<T> = {
  [n: number]: Deferred<T>;
  length: Deferred<number>;
  map: <U>(
    callback: (value: T, index: number, array: T[]) => U
  ) => Deferred<U[]>;
  slice: (start?: number, end?: number) => Deferred<T[]>;
  filter: (
    callback: (value: T, index: number, array: T[]) => boolean
  ) => Deferred<T[]>;
};

function defer<T>(promise: Promise<T>): Deferred<T>;
function defer<F extends (...args: any[]) => any>(
  fn: F
): (...args: Parameters<F>) => Deferred<Awaited<ReturnType<F>>>;

function defer(arg: any): any {
  if (typeof arg === "function") return (...args: any[]) => defer(arg(...args));
  const promise = Promise.resolve(arg);
  return new Proxy(() => {}, {
    get: (_, prop) => {
      if (prop === Symbol.toPrimitive) return () => "[Defer Proxy]";
      if (prop === "then") return promise.then.bind(promise);
      if (prop === "catch") return promise.catch.bind(promise);
      if (prop === "finally") return promise.finally.bind(promise);
      if (prop === "fmap") return (fn: any) => defer(promise.then(fn));
      return defer(
        promise.then((v: any) => {
          const val = v?.[prop];
          if (typeof val === "function") return val.bind(v);
          return val;
        })
      );
    },
    apply: (_, __, args) => defer(promise.then((v: any) => v(...args))),
  });
}

export { defer, type Deferred };
