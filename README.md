# 图片主副色调提取器 (ColorExtractor)

基于 **K-means 聚类算法** 的图片颜色提取工具，可分析图片的主要颜色并输出 HEX、RGB 格式及占比信息。

## 功能特性

- 从**本地图片文件**提取主色调
- 从**图片 URL** 提取主色调（支持 CORS 及跨域下载）
- 使用 **K-means++** 初始化，收敛更快
- 可配置提取颜色数量、采样尺寸、迭代次数
- 输出 HEX、RGB 及每种颜色的占比
- 提供分析耗时统计

## 技术栈

- **Vue 3** - 前端框架
- **Vite 7** - 构建工具
- **TypeScript** - 类型支持
- **Tailwind CSS + DaisyUI** - 样式

## 环境要求

- Node.js: `^20.19.0 || >=22.12.0`
- pnpm: `10.30.2+`

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## API 使用

### 从文件提取颜色

```typescript
import { extractColorsFromFile } from "./utils/colorExtractor";

const file = document.querySelector('input[type="file"]').files[0];
const { colors, analysisTimeMs } = await extractColorsFromFile(file, {
  colorCount: 6,      // 提取颜色数量，默认 6
  maxSize: 100,       // 图片降采样最大尺寸，默认 100
  maxIterations: 20,  // K-means 最大迭代次数，默认 20
});

console.log(colors);
// [{ hex: "#2a3b4c", rgb: "rgb(42, 59, 76)", r: 42, g: 59, b: 76, percentage: "25.3" }, ...]
```

### 从 URL 提取颜色

```typescript
import { extractColorsFromUrl } from "./utils/colorExtractor";

const { colors, analysisTimeMs } = await extractColorsFromUrl(
  "https://example.com/image.jpg",
  { colorCount: 5 }
);
```

### 返回结果类型

```typescript
interface ColorResult {
  hex: string;       // 如 "#ff5733"
  rgb: string;       // 如 "rgb(255, 87, 51)"
  r: number;
  g: number;
  b: number;
  percentage: string; // 占比，如 "18.5"
}

interface ExtractResult {
  colors: ColorResult[];
  analysisTimeMs: number; // K-means 分析耗时（毫秒）
}
```

## 项目结构

```
ColorExtractor/
├── src/
│   ├── utils/
│   │   └── colorExtractor.ts   # 核心颜色提取逻辑
│   ├── examples/
│   │   └── colorExtractorExample.ts  # 使用示例
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 入口文件
│   └── css/
│       └── main.css
├── index.html
├── package.json
└── README.md
```

## 算法说明

本工具使用 **K-means 聚类** 对图片像素进行颜色聚类：

1. **降采样**：将图片缩放到指定尺寸，减少计算量
2. **K-means++ 初始化**：选择彼此距离较远的初始聚类中心，加速收敛
3. **迭代优化**：分配像素到最近中心，更新中心位置，直至收敛
4. **结果排序**：按颜色占比从高到低排序输出

## 许可证

MIT
