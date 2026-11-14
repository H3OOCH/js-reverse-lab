#!/usr/bin/env node
// tools/_gen_l3.mjs —— 生成 L3 靶子用的加密串（一次性，生成后把输出粘进靶子）
// 加密方式：明文 = words.join('|')  →  逐字节 XOR key  →  base64
// key 在靶子里由位运算推导（不直接写出），这里同步算一遍保证一致。

const KEY = ((0x2d << 1) ^ (0x7f - 3)) & 0xff; // 0x5a ^ 0x7c = 0x26
const words = ['md5', 'hex', 'toUpperCase', 'sort', 'join', '&', 'keys', ':', 'g7Kx', '!2pQ'];

const plain = words.join('|');
const bytes = Buffer.from(plain, 'utf8');
const xor = Buffer.alloc(bytes.length);
for (let i = 0; i < bytes.length; i++) xor[i] = bytes[i] ^ KEY;
const blob = xor.toString('base64');

// 切成 3 段，靶子里分开存放、运行时拼回
const third = Math.ceil(blob.length / 3);
const parts = [blob.slice(0, third), blob.slice(third, third * 2), blob.slice(third * 2)];

console.log('KEY =', '0x' + KEY.toString(16), '(', KEY, ')');
console.log('plain =', plain);
console.log('blob  =', blob);
console.log('parts =', JSON.stringify(parts, null, 2));
