import { describe, it, expect } from "vitest";
import { defer } from "./index";

const isDeferred = (value: any) => String(value) === "[Defer Proxy]";

describe("defer", () => {
  // 基本测试
  it("应该创建一个延迟代理", () => {
    const deferred = defer(Promise.resolve(1));
    expect(deferred).toBeDefined();
  });

  it("应该返回一个代理对象", () => {
    const deferred = defer(Promise.resolve(1));
    expect(isDeferred(deferred)).toBe(true);
  });

  it("应该支持链式调用", () => {
    const deferred = defer(Promise.resolve({ a: { b: { c: 1 } } }));
    expect(isDeferred(deferred.a)).toBe(true);
    expect(isDeferred(deferred.a.b)).toBe(true);
    expect(isDeferred(deferred.a.b.c)).toBe(true);
  });

  it("应该支持数组操作", () => {
    const deferred = defer(Promise.resolve([1, 2, 3]));
    expect(isDeferred(deferred[0])).toBe(true);
    expect(isDeferred(deferred[1])).toBe(true);
    expect(isDeferred(deferred[2])).toBe(true);
  });

  // 基本值测试
  it("应该解析基本值", async () => {
    const deferred = defer(Promise.resolve(42));
    const result = await deferred;
    expect(result).toBe(42);
  });

  it("应该解析复杂类型", async () => {
    const deferred = defer(Promise.resolve({ a: { b: { c: 1 } } }));
    expect(await deferred.a).toEqual({ b: { c: 1 } });
    expect(await deferred.a.b).toEqual({ c: 1 });
    expect(await deferred.a.b.c).toBe(1);
  });

  it("应该解析数组", async () => {
    const deferred = defer(Promise.resolve([1, 2, 3]));
    expect(await deferred[0]).toBe(1);
    expect(await deferred[1]).toBe(2);
    expect(await deferred[2]).toBe(3);
  });

  it("应该解析对象", async () => {
    const deferred = defer(Promise.resolve({ a: 1, b: 2, c: 3 }));
    expect(await deferred.a).toBe(1);
    expect(await deferred.b).toBe(2);
    expect(await deferred.c).toBe(3);
  });

  // 数组测试
  it("应该支持数组 length 属性", async () => {
    const arr = [1, 2, 3, 4, 5];
    const deferred = defer(Promise.resolve(arr));

    const length = await deferred.length;

    expect(length).toBe(5);
  });

  it("应该支持数组 map 方法", async () => {
    const arr = [1, 2, 3, 4, 5];
    const deferred = defer(Promise.resolve(arr));

    // const mapped = deferred.map.$((x: number) => x * 2);
    const mapped = deferred.map.$((x: number) => x * 2);
    expect(String(mapped)).toBe("[Defer Proxy]");
    expect(await mapped).toEqual([2, 4, 6, 8, 10]);
  });

  // 函数测试
  it("应该支持函数代理", async () => {
    const fn = (a: number, b: number) => a + b;
    const deferFn = defer(fn);

    const result = await deferFn(5, 3);
    expect(result).toBe(8);
  });

  it("应该支持异步函数代理", async () => {
    const asyncFn = async (a: number, b: number) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(a * b), 10);
      });
    };

    const deferFn = defer(asyncFn);
    const result = await deferFn(4, 5);
    expect(result).toBe(20);
  });

  // 链式调用测试
  it("应该支持链式属性访问", async () => {
    const obj = {
      user: {
        profile: {
          name: "张三",
          age: 30,
        },
      },
    };

    const deferred = defer(Promise.resolve(obj));
    const name = await deferred.user.profile.name;
    const age = await deferred.user.profile.age;

    expect(name).toBe("张三");
    expect(age).toBe(30);
  });

  it("应该支持链式方法调用", async () => {
    const obj = {
      getData: () => ({
        process: (x: number) => x * 2,
        format: (x: number) => `结果: ${x}`,
      }),
    };

    const deferred = defer(Promise.resolve(obj));
    const processed = await deferred.getData.$().process.$(5);
    const formatted = await deferred.getData.$().format.$(10);

    expect(processed).toBe(10);
    expect(formatted).toBe("结果: 10");
  });

  // 错误处理测试
  it("应该正确处理 Promise 拒绝", async () => {
    const failedPromise = Promise.reject<number>(new Error("测试错误"));
    const deferred = defer(failedPromise);

    await expect(deferred).rejects.toThrow("测试错误");
  });

  it("应该处理访问不存在的属性", async () => {
    const obj = { a: 1 } as { a: number; b?: number };
    const deferred = defer(Promise.resolve(obj));

    // 使用类型断言来避免类型错误
    const result = await deferred.b;
    expect(result).toBeUndefined();
  });

  // Unwrap 接口测试
  it("应该支持 Unwrap 接口", async () => {
    const deferred = defer(Promise.resolve(42));

    let result: number | undefined;
    await deferred.then((value) => {
      result = value;
      return value;
    });

    expect(result).toBe(42);
  });

  it("应该支持 Unwrap 接口的错误处理", async () => {
    const error = new Error("测试错误");
    const deferred = defer<number>(Promise.reject(error));

    let caughtError: Error | undefined;
    await deferred.catch((err: any) => {
      caughtError = err;
      return 0;
    });

    expect(caughtError).toBe(error);
  });

  it("应该支持 fmap 方法", async () => {
    const deferred = defer(Promise.resolve(1));
    const mapped = deferred.fmap((x) => x * 2);
    expect(String(mapped)).toBe("[Defer Proxy]");
  });

  it("应该支持 fmap 方法的错误处理", async () => {
    const deferred = defer(Promise.resolve(1));
    const mapped = deferred.fmap(() => {
      throw new Error("测试错误");
    });

    await expect(mapped).rejects.toThrow("测试错误");
  });

  it("应该支持 fmap 方法的链式调用", async () => {
    const deferred = defer(Promise.resolve(1));
    const mapped = deferred.fmap((x) => x * 2).fmap((x) => x * 3);
    expect(String(mapped)).toBe("[Defer Proxy]");
    expect(await mapped).toBe(6);
  });

  it("应该支持 fmap 方法的异步链式调用", async () => {
    const deferred = defer(Promise.resolve(1));
    const mapped = deferred
      .fmap(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return x * 2;
      })
      .fmap(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return x * 3;
      });

    expect(String(mapped)).toBe("[Defer Proxy]");
    expect(await mapped).toBe(6);
  });

  it("应该支持结构化赋值", async () => {
    const deferred = defer(Promise.resolve({ a: 1, b: 2, c: 3 }));
    const { a, b, c } = deferred;
    expect(String(a)).toBe("[Defer Proxy]");
    expect(String(b)).toBe("[Defer Proxy]");
    expect(String(c)).toBe("[Defer Proxy]");
    expect(await a).toBe(1);
    expect(await b).toBe(2);
    expect(await c).toBe(3);
  });

  it("应该支持 fmap 方法的结构化赋值", async () => {
    const deferred = defer(Promise.resolve({ a: 1, b: 2, c: 3 }));
    const x = deferred.fmap(({ a, b, c }) => ({ a, b, c }));
    const { a, b, c } = x;
    expect(String(a)).toBe("[Defer Proxy]");
    expect(String(b)).toBe("[Defer Proxy]");
    expect(String(c)).toBe("[Defer Proxy]");
    expect(await a).toBe(1);
    expect(await b).toBe(2);
    expect(await c).toBe(3);
  });
});
