// targets/sign.obf2.mjs —— 二层难度靶子（练习用）
// 与 reference/answer.mjs 功能完全一致。相比 sign.obf.mjs 增加：
//   1) 字符串加密：base64 + XOR(0x5a)，运行时才解码 —— 静态搜 'md5'/'join' 全部失效
//   2) 跳转表：控制流平坦化升级成「函数表 + 序号」，连 switch 都没有
//   3) 位运算伪装常量：16 写成 (0x40 >> 2)
//   4) 启动自检：字符串表被动过就直接抛错，防止"手改靶子凑答案"
import { createHash as _H } from 'node:crypto';

// ---- 加密字符串表：base64(原文 XOR 0x5a) ----
const _E = {
  md5: 'Nz5v',
  hex: 'Mj8i',
  upper: 'LjUPKio/KBk7KT8=',
  sort: 'KTUoLg==',
  join: 'MDUzNA==',
  amp: 'fA==',
  keys: 'MT8jKQ==',
  colon: 'YA==',
};

const _K = 0x5a;

// 运行时解码：base64 → 逐字节 XOR → UTF-8
function _d(_b) {
  const _raw = Buffer.from(_b, 'base64');
  const _out = Buffer.alloc(_raw.length);
  for (let _i = 0; _i < _raw.length; _i++) _out[_i] = _raw[_i] ^ _K;
  return _out.toString('utf8');
}

// 盐：两段密文拼接后解码（'g7Kx' + '!2pQ'）
const _SALT_A = 'PW0RIg=='; // g7Kx ^ 0x5a
const _SALT_B = 'e2gqCw=='; // !2pQ ^ 0x5a

// 启动自检：解码失败或长度异常就抛错
(function _selfCheck() {
  if (_d(_E.md5) !== 'md5' || _d(_E.hex).length !== 3) throw new Error('string table corrupted');
})();

// ---- 跳转表：每步一个函数，按返回的序号串起来 ----
const _steps = [
  // 0: keys(p).sort()
  (p, c) => {
    c.keys = Object[_d(_E.keys)](p)[_d(_E.sort)]();
    return 1;
  },
  // 1: keys.map(k => k + '=' + p[k]).join('&')
  (p, c) => {
    c.canonical = c.keys.map((k) => k + '=' + p[k]).join(_d(_E.amp));
    return 2;
  },
  // 2: canonical + ':' + salt
  (p, c) => {
    c.canonical = c.canonical + _d(_E.colon) + (_d(_SALT_A) + _d(_SALT_B));
    return 3;
  },
  // 3: md5(...).digest('hex').toUpperCase()
  (p, c) => {
    c.digest = _H(_d(_E.md5)).update(c.canonical).digest(_d(_E.hex))[_d(_E.upper)]();
    return 4;
  },
  // 4: slice(0, 0x40 >> 2) —— 即 16
  (p, c) => {
    c.digest = c.digest.slice(0, 0x40 >> 2);
    return -1;
  },
];

export function sign(_p) {
  const _ctx = { keys: null, canonical: '', digest: '' };
  let _i = 0;
  let _guard = 0;
  while (_i !== -1) {
    if (_i < 0 || _i >= _steps.length) throw new Error('bad jump: ' + _i);
    if (++_guard > 64) throw new Error('loop guard');
    _i = _steps[_i](_p, _ctx);
  }
  return _ctx.digest;
}
