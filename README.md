# js-reverse-lab

**一个自造的 JS 逆向练习靶场：把「混淆 → 还原」这件事做成可复现、可对拍的练习。**

> ⚠️ 声明：仓库里所有靶子都是**本项目自己生成**的，不针对任何真实站点、产品接口或他人代码。
> 目的只有两个：练手，和讲清楚方法。

## 为什么自己做靶子

真实站点的签名有两件事做不到：**没法验证、不能发布**。
自造靶子有答案、有对拍器，所以能回答最关键的一句：**我到底还原对了没有**。

## 结构

```
targets/sign.obf.mjs     一层靶子（字符串数组 + 索引表、switch 平坦化、常量折叠）
targets/sign.obf2.mjs    二层靶子（字符串 base64+XOR、跳转表、位运算常量、自检）
targets/sign.obf3.mjs    三层靶子（整串加密拆分存放、Proxy 防枚举、诱饵函数、反调试）
reference/answer.mjs     参考答案（人类可读版）
tools/verify.mjs         对拍器：同一批输入分别喂靶子和答案，逐条比对
tools/hints.mjs          翻表辅助：打印字符串表与索引映射
tools/deobf.mjs          一层靶子的还原版（只读混淆代码写出来的）
tools/crosscheck.mjs     还原版 vs 靶子 对拍（不看答案也能自证）
tools/_gen_l3.mjs        L3 加密串生成器（改靶子时可重算）
walkthrough.md           还原过程与踩坑记录
```

## 三个靶子

| 靶子 | 手法 | 难度 |
|---|---|---|
| `sign.obf.mjs` | 字符串数组 + 索引表、`switch` 状态机、常量折叠 | 入门 |
| `sign.obf2.mjs` | **字符串 base64 + XOR**、跳转表（函数表 + 序号）、位运算伪装常量、启动自检 | 进阶 |
| `sign.obf3.mjs` | **整串加密 + 切 3 段存放**、key 由位运算推导、Proxy 禁止枚举、**诱饵函数**、**反调试**（`crypto.createHash` 被替换即抛错） | 困难 |

L3 的关键差别：**代码不能只靠读**——`Object.keys` 会抛 `enumeration blocked`，
直接 `console.log` 拿不到字符串表，必须想办法在运行时把解码结果截出来（断点 / hook / 复现 key）。
另外 `_fake()` 是诱饵：算出来的东西看着像签名，永远是错的。

二层的关键差异：**静态搜索 `md5`、`join` 全部失效**——字面量只在运行时解出来；
字符串表被改动会直接触发自检抛错（不能靠"改靶子凑答案"）。

```bash
node tools/verify.mjs                  # 一层靶子
node tools/verify.mjs --target obf2    # 二层靶子
```


## 用法

```bash
node tools/verify.mjs              # 200 条用例对拍（固定边界 + 随机）
node tools/verify.mjs --n 500      # 加量
node tools/verify.mjs --show 3     # 打印前 3 组输入输出
```

退出码 0 = 完全一致；1 = 有不一致（会打印第一处差异）。

## 靶子难度设计

| 层 | 手法 | 读代码时的症状 |
|---|---|---|
| 1 | 字符串乱序存放 + 索引表 `_idx` | 看不到 `md5`、`join` 这些字面量，只看到 `_g(0)`、`_g(4)` |
| 2 | 控制流平坦化 | 没有顺序结构，只有 `while + switch(_st)` 状态机 |
| 3 | 常量折叠 | `16` 写成 `8 * 2`，盐被拆成两段运行时拼 |

## 已踩过的坑（写进 walkthrough 用）

- **索引表错位**：第一版 `_idx` 少算了一个位置，`_g(6)` 取到 `':'` 而不是 `'keys'`，运行时直接 `Object[...] is not a function`。
  这就是混淆代码最常见的形态：**逻辑没错，映射错了**——报错在运行时，线索只有类型不符。

## 续集

- 再加一层：字符串加密（XOR + 运行时解密），让静态搜索失效
- 拿一个**开源项目**里真实的 sign 实现做演练（合法、可引用）
- 补一个 `tools/deobf-hints.mjs`：自动打印字符串表与索引表，减少手工翻查

## License

MIT（仅用于教学与自测）


```bash
node tools/verify.mjs                  # L1
node tools/verify.mjs --target obf2    # L2
node tools/verify.mjs --target obf3    # L3
```
