#!/usr/bin/env node
/**
 * crosscheck.mjs —— 把「还原版」和「靶子」对拍（不涉及参考答案）
 *
 * 用法：node tools/crosscheck.mjs [--n 300] [--show 5]
 * 退出码：0 一致；1 有差异
 */
import { sign as target } from '../targets/sign.obf.mjs';
import { sign as deobf } from './deobf.mjs';

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : def;
};
const N = arg('--n', 300);
const SHOW = arg('--show', 5);

const fixed = [
  {},
  { a: '1' },
  { b: '2', a: '1' },
  { a: '10', b: '2' },
  { 姓名: '胡腾熠', 学号: '24H034160236' },
  { z: 'x'.repeat(300) },
  { a: '', b: '' },
  { sign: 'ignore-me', ts: '1700000000', nonce: 'abc123' },
];

const rnd = (n) => Math.floor(Math.random() * n);
const keys = ['a', 'b', 'c', 'id', 'ts', 'nonce', 'q', 'page', 'size', 'keyword'];
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
const randVal = () => Array.from({ length: rnd(10) + 1 }, () => alphabet[rnd(alphabet.length)]).join('');
const randCase = () => {
  const o = {};
  const n = rnd(5) + 1;
  for (let i = 0; i < n; i++) o[keys[rnd(keys.length)]] = randVal();
  return o;
};

const cases = [...fixed, ...Array.from({ length: Math.max(0, N - fixed.length) }, randCase)];
let bad = 0;
let firstDiff = null;
for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const a = target(c);
  const b = deobf(c);
  if (i < SHOW) console.log(`#${i} ${JSON.stringify(c)} → 靶子 ${a} / 还原 ${b}`);
  if (a !== b) {
    bad++;
    if (!firstDiff) firstDiff = { c, a, b };
  }
}
console.log(`\n用例 ${cases.length} 条，不一致 ${bad} 条`);
if (bad) {
  console.log('第一处差异 → 输入', JSON.stringify(firstDiff.c), '靶子', firstDiff.a, '还原', firstDiff.b);
  process.exit(1);
}
console.log('✅ 还原版与靶子行为完全一致');
