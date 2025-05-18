# defer-proxy

一个轻量且强类型的 TypeScript Promise 代理库，支持对 Promise 结果进行链式属性访问和函数调用，自动帮你解包 Promise 并保持链式调用的便捷性。

## 功能特性

- 支持链式访问 Promise 内嵌对象属性，如 `defer(promise).a.b.c`
- 支持直接调用 Promise 结果的函数，如 `defer(promise).a.b.c(x)`
- **完全实现标准 Promise 接口**，可以直接使用 `await` 或 `.then()/.catch()/.finally()`
- **兼容 React 19 Suspense**，可以在 React 组件中直接使用
- **提供 `fmap` 方法**，支持函数式编程风格的数据转换
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

// 链式访问属性，返回 Deferred
const userName = defer(promise).user.name;

// 调用 Promise 结果中的函数，返回 Deferred
const greeting = defer(promise).user.greet("世界");

// 直接使用 await 解包 Promise
console.log(await userName); // 输出：张三
console.log(await greeting); // 输出：你好，世界

// 使用标准 Promise 接口
userName.then(console.log); // 输出：张三
greeting.then(console.log); // 输出：你好，世界

// 使用 fmap 进行数据转换
const upperName = defer(promise).user.name.fmap((name) => name.toUpperCase());
console.log(await upperName); // 输出：张三 (转换为大写)

// 函数包装用法
const fetchUser = async (id: number) => ({ id, name: "张三" });
const deferredFetchUser = defer(fetchUser);

// 调用包装后的函数，返回 Deferred 对象
const user = deferredFetchUser(1);
// 链式访问结果属性
console.log(await user.name); // 输出：张三

// 结合 fmap 使用
const formattedUser = deferredFetchUser(1).fmap((user) => ({
  ...user,
  displayName: `用户: ${user.name}`,
}));
console.log(await formattedUser); // 输出: { id: 1, name: '张三', displayName: '用户: 张三' }
```

## 使用场景

该库适合以下场景：

- 处理复杂的嵌套异步数据结构，简化访问链
- 需要对异步结果进行多次操作而不希望使用多层 `.then()` 的情况
- 希望保持代码可读性同时处理异步操作
- 在 React 组件中使用 Suspense 进行数据获取

### 与 React 19 Suspense 结合使用

`defer-proxy` 完全兼容 React 19 Suspense，可以直接在 React 组件中使用，无需额外配置：

```tsx
// 在 React 组件中使用示例
function UserProfile({ userId }) {
  // 直接在组件中使用，Suspense 会自动处理等待状态
  const user = defer(fetchUser(userId));

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
      <div>
        {user.friends.map((friend) => (
          <span key={friend.id}>{friend.name}</span>
        ))}
      </div>
    </div>
  );
}

// 在父组件中使用 Suspense 包裹
function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

## API 说明

### `defer<T>(promise: Promise<T>): Deferred<T> & Promise<T>`

传入一个 Promise，返回一个代理对象 `Deferred<T>`，同时实现了 `Promise<T>` 接口，支持：

- 属性访问时继续返回代理，保持链式调用
- 函数调用时自动调用 Promise 解析后的函数，并返回代理结果
- 直接使用 `await` 或 `.then()/.catch()/.finally()` 方法
- 支持 `.fmap(fn)` 方法，用于对 Promise 结果进行变换，类似 `Promise.then` 但返回 Deferred 对象
- 支持对数组的常见操作方法链式调用

### `defer<F extends (...args: any[]) => any>(fn: F): (...args: Parameters<F>) => Deferred<Awaited<ReturnType<F>>> & Promise<Awaited<ReturnType<F>>>`

传入一个函数，返回一个包装后的函数，调用时会：

- 自动执行原函数并将结果包装为 `Deferred` 对象
- 保留原函数的参数类型
- 返回值类型为 `Deferred<Awaited<ReturnType<F>>> & Promise<Awaited<ReturnType<F>>>`，支持链式调用和标准 Promise 接口
- 适用于包装异步 API，使其返回值可以进行链式访问

### `Deferred<T>.fmap<U>(fn: (value: T) => U): Deferred<U>`

对 Deferred 对象的值应用转换函数，并返回新的 Deferred 对象：

- 参数 `fn` 是一个接收解析后的值并返回新值的函数
- 返回一个新的 `Deferred<U>` 对象，其中 `U` 是转换函数的返回类型
- 类似于 `Promise.then`，但保持了 Deferred 的特性，可以继续链式访问
- 适合在保持 Deferred 特性的同时对数据进行转换

## 类型说明

- `Deferred<T> & Promise<T>` 表示一个对应于 `T` 结构的代理，同时实现了标准 Promise 接口
- `Defer<T>` 包含 Promise 接口和 `fmap` 方法
- 支持数组类型代理，包含 `.map()`、`.slice()`、`.filter()` 等常用方法

## 注意事项

- 如果传入的 Promise 发生拒绝（reject），可以通过标准的 Promise 接口处理异常，如 `.catch()` 或 async/await 的 try-catch
- `fmap` 方法与 `Promise.then` 类似，但它始终返回 Deferred 对象，便于继续链式操作
- 该库适合有复杂异步数据结构访问需求的场景，使用 TypeScript 时类型推断和编辑器补全体验最佳

## 许可证

WTFPL
