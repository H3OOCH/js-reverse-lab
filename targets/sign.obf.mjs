// targets/sign.obf.mjs —— 混淆靶子（练习用）
// 与 reference/answer.mjs 功能完全一致，做了三层混淆：
//   1) 字符串乱序存放 + 索引表映射（逻辑里的字符串字面量都变成 _g(k)）
//   2) 控制流平坦化（while + switch 状态机）
//   3) 常量折叠（16 写成 8*2，盐拆成两段运行时拼接）
//
// 目标：只靠读代码（不运行、不看参考答案），把算法还原出来。
import { createHash as _h } from 'node:crypto';

// 逻辑含义 → 物理位置：md5,hex,toUpperCase,sort,join,&,:,=,'',slice,g7Kx,!2pQ,length,keys,map,reduce
const _s = [
  'join', 'slice', 'sort', '=', 'g7Kx', '&', 'keys', 'reduce',
  'toUpperCase', 'md5', '!2pQ', 'hex', 'length', 'map', ':', '',
];
const _idx = [9, 11, 8, 2, 0, 5, 14, 3, 15, 1, 4, 10, 12, 6, 13, 7];
const _g = (k) => _s[_idx[k]];

export function sign(_p) {
  let _st = 0;
  let _keys = null;
  let _canonical = '';
  let _digest = '';
  while (_st !== 99) {
    switch (_st) {
      case 0:
        _keys = Object[_g(13)](_p)[_g(3)]();      // keys() → sort()
        _st = 1;
        break;
      case 1:
        _canonical = _keys[_g(14)]((_x) => _x + _g(7) + _p[_x])[_g(4)](_g(5)); // map → join('&')
        _st = 2;
        break;
      case 2:
        _canonical = _canonical + _g(6) + (_g(10) + _g(11));  // + ':' + salt
        _st = 3;
        break;
      case 3:
        _digest = _h(_g(0)).update(_canonical).digest(_g(1))[_g(2)]();  // md5 → hex → upper
        _st = 4;
        break;
      case 4:
        _digest = _digest[_g(9)](0, 8 * 2);       // slice(0, 16)
        _st = 99;
        break;
      default:
        _st = 99;
    }
  }
  return _digest;
}
