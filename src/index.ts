/**
 * @license
 * Copyright © 2025 rsooio <i@rsoo.io>
 * This work is free. You can redistribute it and/or modify it under the
 * terms of the Do What The Fuck You Want To Public License, Version 2,
 * as published by Sam Hocevar. See the COPYING file for more details.
 */

declare const noExpand: unique symbol;
type NoExpand<T> = T & { [noExpand]?: never };

type Defer<T> = Promise<Awaited<T>> & {
  fmap<U>(fn: (value: Awaited<T>) => U): Deferred<Awaited<U>>;
};

type Deferred<T> = NoExpand<
  NonNullable<T> extends (...args: infer Args) => infer Ret
    ? Defer<T> & DeferredFunction<Args, Ret>
    : NonNullable<T> extends Array<infer U>
    ? Defer<T> & DeferredArray<U>
    : NonNullable<T> extends object
    ? Defer<T> & DeferredObject<T>
    : Defer<T>
>;

type Func<Args extends any[], Ret> = (...args: Args) => Deferred<Ret>;

type DeferredFunction<Args extends any[], Ret> = {
  $: Func<Args, Ret>;
};

type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
type PrettyPartial<T> = Pretty<{ [K in keyof T]?: T[K] }>;

type DeferredObject<T> = {
  [K in keyof T as undefined extends T[K]
    ? never
    : null extends T[K]
    ? never
    : K]: Deferred<T[K]>;
} & {
  [K in keyof T as undefined extends T[K]
    ? K
    : null extends T[K]
    ? K
    : never]-?: Deferred<PrettyPartial<T[K]>>;
};

type DeferredArray<T> = {
  [n: number]: Deferred<T>;
  length: Deferred<number>;
  map: {
    $: <U>(
      callback: (value: T, index: number, array: T[]) => U
    ) => Deferred<U[]>;
  };
  slice: DeferredFunction<[number, number], T[]>;
  filter: DeferredFunction<
    [callback: (value: T, index: number, array: T[]) => boolean],
    T[]
  >;
};

function defer<T>(promise: Promise<T>): Deferred<T>;
function defer<F extends (...args: any[]) => any>(
  fn: F
): (...args: Parameters<F>) => Deferred<Awaited<ReturnType<F>>>;

function defer(arg: any): any {
  if (typeof arg === "function") return (...args: any[]) => defer(arg(...args));
  const promise = Promise.resolve(arg);
  return new Proxy({} as {}, {
    get: (_, prop) => {
      if (prop === Symbol.toPrimitive) return () => "[Defer Proxy]";
      if (prop === "then") return promise.then.bind(promise);
      if (prop === "catch") return promise.catch.bind(promise);
      if (prop === "finally") return promise.finally.bind(promise);
      if (prop === "fmap") return (fn: any) => defer(promise.then(fn));
      if (prop === "$")
        return (...args: any[]) =>
          defer(promise.then((v: any) => v?.(...args)));
      return defer(
        promise.then((v: any) => {
          const val = v?.[prop];
          if (typeof val === "function") return val.bind(v);
          return val;
        })
      );
    },
  });
}

export { defer, type Deferred };
