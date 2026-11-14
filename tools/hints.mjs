#!/usr/bin/env node
/**
 * hints.mjs —— 读混淆代码时的"翻表"辅助：把字符串表和索引映射打印出来
 *
 * 用法：node tools/hints.mjs
 * 作用：省掉人工数下标的时间，但仍然需要你自己判断"哪个下标对应哪个语义"。
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../targets/sign.obf.mjs', import.meta.url), 'utf8');

// 粗暴提取 _s = [...] 里的字符串（够用就行，不做完整解析）
const sMatch = src.match(/const\s+_s\s*=\s*\[([\s\S]*?)\];/);
const idxMatch = src.match(/const\s+_idx\s*=\s*\[([\s\S]*?)\];/);
if (!sMatch || !idxMatch) {
  console.error('没找到 _s / _idx，靶子结构变了？');
  process.exit(1);
}

const parseStrings = (body) => [...body.matchAll(/'([^']*)'/g)].map((m) => m[1]);
const parseNums = (body) => [...body.matchAll(/\d+/g)].map((m) => Number(m[0]));

const S = parseStrings(sMatch[1]);
const IDX = parseNums(idxMatch[1]);

console.log(`字符串表 _s（共 ${S.length} 项）：`);
S.forEach((v, i) => console.log(`  _s[${String(i).padStart(2)}] = ${JSON.stringify(v)}`));

console.log(`\n索引表 _idx（共 ${IDX.length} 项）：`);
console.log('  ' + IDX.join(', '));

console.log('\n映射 _g(k) = _s[_idx[k]]：');
IDX.forEach((pos, k) => {
  const v = S[pos];
  console.log(`  _g(${String(k).padStart(2)}) -> _s[${String(pos).padStart(2)}] = ${JSON.stringify(v)}`);
});

console.log('\n提示：代码里出现 _g(k) 时，查上表就知道它在调什么。');
