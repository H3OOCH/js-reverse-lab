#!/usr/bin/env node
/**
 * verify.mjs —— 对拍器：同一批输入，分别喂给靶子和参考答案，逐条比对
 *
 * 用法：
 *   node tools/verify.mjs                 # 默认靶子 sign.obf.mjs，200 条
 *   node tools/verify.mjs --target obf2   # 换二层靶子 sign.obf2.mjs
 *   node tools/verify.mjs --n 500         # 自定义次数
 *   node tools/verify.mjs --show 3        # 打印前 3 组输入输出
 *
 * 退出码：0 全部一致；1 有不一致（会列出第一处差异）
 */
const argv = process.argv.slice(2);
const pickTarget = () => {
  const i = argv.indexOf('--target');
  const name = i >= 0 && argv[i + 1] ? argv[i + 1] : 'obf';
  return name === 'obf2'
    ? import('../targets/sign.obf2.mjs')
    : import('../targets/sign.obf.mjs');
};
const { sign: target } = await pickTarget();
const { sign: answer } = await import('../reference/answer.mjs');
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : def;
};
const N = arg('--n', 200);
const SHOW = arg('--show', 0);

// 固定边界用例：空对象、单键、键名排序的坑（a/b vs 10/2）、中文键、长值
const fixed = [
  {},
  { a: '1' },
  { b: '2', a: '1' },            // 顺序不同，结果必须与 {a,b} 相同
  { a: '10', b: '2' },           // 字典序，不是数值序
  { 姓名: '胡腾熠', 学号: '24H034160236' },
  { z: 'x'.repeat(500) },
  { a: '', b: '' },
];

const rnd = (n) => Math.floor(Math.random() * n);
const keys = ['a', 'b', 'c', 'id', 'ts', 'nonce', 'sign', 'q', 'page', 'size'];
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const randVal = () => {
  const len = rnd(8) + 1;
  return Array.from({ length: len }, () => alphabet[rnd(alphabet.length)]).join('');
};
const randCase = () => {
  const obj = {};
  const n = rnd(4) + 1;
  for (let i = 0; i < n; i++) obj[keys[rnd(keys.length)]] = randVal();
  return obj;
};

const cases = [...fixed, ...Array.from({ length: Math.max(0, N - fixed.length) }, randCase)];

let bad = 0;
let firstDiff = null;
for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  let a; let b;
  try {
    a = target(c);
  } catch (e) {
    a = 'THROW:' + e.message;
  }
  try {
    b = answer(c);
  } catch (e) {
    b = 'THROW:' + e.message;
  }
  if (i < SHOW) console.log(`#${i} ${JSON.stringify(c)} → ${a} (答案 ${b})`);
  if (a !== b) {
    bad++;
    if (!firstDiff) firstDiff = { i, c, a, b };
  }
}

console.log(`用例 ${cases.length} 条，不一致 ${bad} 条`);
if (bad) {
  console.log('第一处差异：');
  console.log('  输入:', JSON.stringify(firstDiff.c));
  console.log('  靶子:', firstDiff.a);
  console.log('  答案:', firstDiff.b);
  process.exit(1);
}
console.log('✅ 靶子与参考答案完全一致');
