# defer-proxy

一个轻量且强类型的 TypeScript Promise 代理库，支持对 Promise 结果进行链式属性访问和函数调用，自动帮你解包 Promise 并保持链式调用的便捷性。

## 功能特性

- 支持链式访问 Promise 内嵌对象属性，如 `defer(promise).a.b.c`
- 支持直接调用 Promise 结果的函数，如 `defer(promise).a.b.c(x)`
- 支持显式调用 `.$()` 获取真实 Promise，以便 `.then()` 或 `await`
- 支持数组方法链式调用（map、filter、slice 等）
- 支持函数包装，将普通函数转换为返回 Deferred 对象的函数
- 完善的 TypeScript 类型支持，保证开发体验和类型安全

## 安装

```bash
npm install defer-proxy

# 或者

pnpm add defer-proxy
```

## 使用示例

```ts
import { defer } from "defer-proxy";

const promise = Promise.resolve({
  user: {
    name: "张三",
    greet: (msg: string) => `你好，${msg}`,
    friends: ["李四", "王五"],
  },
});

// 链式访问属性，返回 Deferred，懒加载不触发 Promise 计算
const userName = defer(promise).user.name;

// 调用 Promise 结果中的函数，返回 Deferred
const greeting = defer(promise).user.greet("世界");

// 通过 .$() 显式解包 Promise，支持传入 onFulfilled/onRejected
defer(promise).user.name.$(console.log); // 输出：张三
defer(promise).user.greet("世界").$(console.log); // 输出：你好，世界

// 函数包装用法
const fetchUser = async (id: number) => ({ id, name: "张三" });
const deferredFetchUser = defer(fetchUser);

// 调用包装后的函数，返回 Deferred 对象
const user = deferredFetchUser(1);
// 链式访问结果属性
user.name.$(console.log); // 输出：张三
```

## 使用场景

该库适合以下场景：

- 处理复杂的嵌套异步数据结构，简化访问链
- 需要对异步结果进行多次操作而不希望使用多层 `.then()` 的情况
- 希望保持代码可读性同时处理异步操作

### 与 React 19 Suspense 结合

`defer-proxy` 可以在 React 19 的 Suspense 环境中用于实现流式传输。通过将异步数据包装为可链式访问的形式，开发者可以更优雅地处理组件渲染过程中的数据依赖：

```tsx
// 在 React 组件中使用示例
function UserProfile({ userId }) {
  // 在实际应用中，可以结合 Suspense 使用
  const user = defer(fetchUser(userId));

  return (
    <div>
      <h2>{user.name.$()}</h2>
      <p>{user.bio.$()}</p>
      {/* 其他用户信息 */}
    </div>
  );
}
```

## API 说明

### `defer<T>(promise: Promise<T>): Deferred<T>`

传入一个 Promise，返回一个代理对象 `Deferred<T>`，支持：

- 属性访问时继续返回代理，保持链式调用
- 函数调用时自动调用 Promise 解析后的函数，并返回代理结果
- `.$(onFulfilled?, onRejected?)` 用于显式返回真实 Promise，支持链式 then/catch
- 支持对数组的常见操作方法链式调用

### `defer<F extends (...args: any[]) => any>(fn: F): (...args: Parameters<F>) => Deferred<Awaited<ReturnType<F>>>`

传入一个函数，返回一个包装后的函数，调用时会：

- 自动执行原函数并将结果包装为 `Deferred` 对象
- 保留原函数的参数类型
- 返回值类型为 `Deferred<Awaited<ReturnType<F>>>`，支持链式调用
- 适用于包装异步 API，使其返回值可以进行链式访问

## 类型说明

- `Deferred<T>` 表示一个对应于 `T` 结构的代理，所有属性、方法调用都会被包装成异步链式调用
- 支持数组类型代理，包含 `.map()`、`.slice()`、`.filter()` 等常用方法

## 注意事项

- 如果传入的 Promise 发生拒绝（reject），需在调用链中自行处理异常，比如通过 `.$().catch()` 或 async/await 的 try-catch
- 该库适合有复杂异步数据结构访问需求的场景，使用 TypeScript 时类型推断和编辑器补全体验最佳

## 许可证

WTFPL
