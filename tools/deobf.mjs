// tools/deobf.mjs —— 只看 targets/sign.obf.mjs 的代码，独立还原出来的实现
// 关键：这个文件是"读代码"的产物，不是抄 reference/answer.mjs。
// 对拍时跟 targets/sign.obf.mjs 比，不跟答案比。
import { createHash } from 'node:crypto';

// 从 _s + _idx 解出来的盐：_g(10) + _g(11) → 'g7Kx' + '!2pQ'
const SALT = 'g7Kx!2pQ';

export function sign(params) {
  // _st=0: keys = Object.keys(p).sort()
  // _st=1: canonical = keys.map(x => x + '=' + p[x]).join('&')
  const keys = Object.keys(params).sort();
  let canonical = keys.map((x) => x + '=' + params[x]).join('&');
  // _st=2: canonical += ':' + (g7Kx + !2pQ)
  canonical = canonical + ':' + SALT;
  // _st=3: md5(canonical).digest('hex').toUpperCase()
  let digest = createHash('md5').update(canonical).digest('hex').toUpperCase();
  // _st=4: digest.slice(0, 8*2)
  digest = digest.slice(0, 16);
  return digest;
}
