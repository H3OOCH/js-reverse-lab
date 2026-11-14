// targets/sign.obf3.mjs —— 三层难度靶子（练习用）
// 与 reference/answer.mjs 功能完全一致。相比 obf2 增加：
//   1) 字符串整体加密成一串（XOR key → base64），并且**切成 3 段分开存放**，运行时才拼回
//   2) key 不写死：由位运算推导 ((0x2d << 1) ^ (0x7f - 3))
//   3) 解码结果藏在闭包里，用 Proxy 暴露：枚举（Object.keys）直接抛错，防止"打印整张表"
//   4) 混入一个诱饵函数 _fake()：算出来的东西看着像签名但永远是错的（纯静态读代码会被它带偏）
//   5) 反调试：检测 createHash.toString 是否被改写（被 hook 就降级/抛错）
import { createHash } from 'node:crypto';

// ---- 加密串：3 段，运行时拼接 ----
const _P = [
  'S0ITWk5DXlpSSXNWVkNUZU',
  'dVQ1pVSVRSWkxJT0haAFpN',
  'Q19VWhxaQRFtXloHFFZ3',
];

// ---- key 由位运算推导，不直接出现 ----
const _key = () => ((0x2d << 1) ^ (0x7f - 3)) & 0xff;

// ---- 解码 + 缓存（闭包内，外部拿不到原表）----
const _cache = (() => {
  let words = null;
  return () => {
    if (words) return words;
    const raw = Buffer.from(_P.join(''), 'base64');
    const out = Buffer.alloc(raw.length);
    const k = _key();
    for (let i = 0; i < raw.length; i++) out[i] = raw[i] ^ k;
    words = out.toString('utf8').split('|');
    return words;
  };
})();

// ---- 名字 → 下标（解码后的词表按这个顺序排）----
const _I = { md5: 0, hex: 1, upper: 2, sort: 3, join: 4, amp: 5, keys: 6, colon: 7, g7Kx: 8, p2q: 9 };

// ---- 用 Proxy 暴露：禁止枚举、禁止取 length ----
const W = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') throw new Error('bad key');
    if (prop === 'toString' || prop === '__proto__' || prop === 'length') throw new Error('blocked');
    const idx = _I[prop];
    if (idx === undefined) throw new Error('no such word: ' + prop);
    return _cache()[idx];
  },
  ownKeys() { throw new Error('enumeration blocked'); },
  has() { return false; },
});

// ---- 诱饵：静态读代码会以为签名是这么算的 ----
export function _fake(p) {
  const k = Object.keys(p).join('');
  return createHash(W.md5).update(k + W.g7Kx).digest(W.hex).toUpperCase().slice(0, 16);
}

// ---- 反调试：检测 crypto.createHash 是否被替换（hook 探测）----
import crypto from 'node:crypto';
const _ref = crypto.createHash;
function _guard() {
  if (crypto.createHash !== _ref) throw new Error('createHash was hooked');
}

export function sign(_p) {
  _guard();

  // 0: 取键排序
  const keys = Object[W.keys](_p)[W.sort]();

  // 1: 拼 k=v&k=v
  let canonical = keys.map((x) => x + '=' + _p[x]).join(W.amp);

  // 2: 加盐（盐也是运行时解出来的两段）
  canonical = canonical + W.colon + (W.g7Kx + W.p2q);

  // 3: md5 → hex → 大写
  let digest = createHash(W.md5).update(canonical).digest(W.hex)[W.upper]();

  // 4: 截断到 16（0x40 >> 2）
  digest = digest.slice(0, 0x40 >> 2);

  return digest;
}
