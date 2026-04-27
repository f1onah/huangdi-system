# 黄帝养成系统 CET-6 词库导入包

本包由用户上传的 Excel 词表转换而来，共 5523 条词汇记录。

## 文件说明

- `cet6_vocab_full_5523_huangdi.json`：完整词库，一次性导入使用。
- `cet6_vocab_part_01.json` ~ `cet6_vocab_part_06.json`：分块词库，每块约 1000 条，适合浏览器分批导入。
- `manifest.json`：导入包说明和字段结构。

## 字段结构

```ts
type Word = {
  id: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  rawMeaning: string;
  phrase: string;
  sentence: string;
  familiarity: number;
  wrongCount: number;
  correctCount: number;
  note: string;
  tags: string[];
  sourceOrder: number;
};
```

## 建议导入逻辑

1. 优先支持导入完整 JSON 数组。
2. 若浏览器性能不稳定，可支持分块导入。
3. 导入时按 `word + sourceOrder` 去重更稳，避免大小写词条被误删。
4. `phrase` 与 `sentence` 暂为空字段，不要在导入时当作错误。
