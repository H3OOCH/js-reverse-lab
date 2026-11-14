// reference/answer.mjs —— 参考答案（人类可读版）
// 靶子 targets/sign.obf.mjs 就是它的混淆版：功能必须完全一致。
import { createHash } from 'node:crypto';

const SALT = 'g7Kx!2pQ';

/** 规范化：键排序 → k=v&k=v → 拼盐 → md5 大写 → 取前 16 位 */
export function sign(params) {
  const keys = Object.keys(params).sort();
  const canonical = keys.map((k) => `${k}=${params[k]}`).join('&');
  const digest = createHash('md5').update(`${canonical}:${SALT}`).digest('hex').toUpperCase();
  return digest.slice(0, 16);
}
