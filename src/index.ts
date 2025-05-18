declare const noExpand: unique symbol;
type NoExpand<T> = T & { [noExpand]?: never };

export type Defined<T> = T extends undefined ? never : T;

export type Unwrapable<T> = {
  $<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2>;
};

export type Deferred<T> = NoExpand<
  Defined<T> extends (...args: infer Args) => infer Ret
    ? (...args: Args) => Deferred<Awaited<Ret>> & Unwrapable<Awaited<Ret>>
    : Defined<T> extends Array<infer U>
    ? DeferredArray<U> & Unwrapable<Awaited<T>>
    : Defined<T> extends object
    ? { [K in keyof Defined<T>]: Deferred<Defined<T>[K]> } & Unwrapable<
        Awaited<T>
      >
    : Unwrapable<Awaited<T>>
>;

export interface DeferredArray<T> {
  [n: number]: Deferred<T>;
  length: Deferred<number>;
  map: <U>(
    callback: (value: T, index: number, array: T[]) => U
  ) => Deferred<U[]>;
  slice: (start?: number, end?: number) => Deferred<T[]>;
  filter: (
    callback: (value: T, index: number, array: T[]) => boolean
  ) => Deferred<T[]>;
}

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
      if (prop === "$") return promise.then.bind(promise);
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

export { defer };
