# 图片颜色提取工具

这是一个基于 K-means 聚类算法的图片颜色提取工具，可以分析图片并提取主要颜色。

## 功能特性

- ✅ **文件处理**: 直接处理本地图片文件
- ✅ **URL 下载**: 从网络 URL 下载并分析图片
- ✅ **K-means 聚类**: 使用先进的聚类算法提取主要颜色
- ✅ **跨域支持**: 自动处理 CORS 问题
- ✅ **TypeScript 支持**: 完整的类型定义
- ✅ **自定义选项**: 可配置颜色数量、采样大小等参数

## 安装和导入

```typescript
import {
  extractColorsFromFile,
  extractColorsFromUrl,
  type ColorResult,
  type ExtractOptions,
} from "./utils/colorExtractor";
```

## API 文档

### 类型定义

```typescript
interface ColorResult {
  hex: string; // HEX颜色值，如 "#ff0000"
  rgb: string; // RGB颜色值，如 "rgb(255, 0, 0)"
  r: number; // 红色分量 (0-255)
  g: number; // 绿色分量 (0-255)
  b: number; // 蓝色分量 (0-255)
  percentage: string; // 颜色占比，如 "25.5"
}

interface ExtractOptions {
  colorCount?: number; // 提取的颜色数量，默认为6
  maxSize?: number; // 图片降采样的最大尺寸，默认为100
  maxIterations?: number; // K-means算法的最大迭代次数，默认为20
}
```

### 主要函数

#### extractColorsFromFile

从本地文件提取颜色。

```typescript
extractColorsFromFile(file: File, options?: ExtractOptions): Promise<ExtractResult>
```

**返回值 ExtractResult:**

- `colors`: 颜色结果数组
- `analysisTimeMs`: K-means 分析耗时（毫秒），不含图片加载时间

**参数:**

- `file`: 图片文件对象
- `options`: 可选的提取选项

**示例:**

```typescript
// 基本用法
const { colors, analysisTimeMs } = await extractColorsFromFile(file);

// 自定义选项
const { colors } = await extractColorsFromFile(file, {
  colorCount: 8, // 提取8种颜色
  maxSize: 200, // 更大的采样尺寸
  maxIterations: 30, // 更多迭代次数
});
```

#### extractColorsFromUrl

从网络 URL 下载图片并提取颜色。

```typescript
extractColorsFromUrl(url: string, options?: ExtractOptions): Promise<ExtractResult>
```

**返回值 ExtractResult:**

- `colors`: 颜色结果数组
- `analysisTimeMs`: K-means 分析耗时（毫秒），不含图片加载时间

**参数:**

- `url`: 图片 URL 地址
- `options`: 可选的提取选项

**示例:**

```typescript
// 基本用法
const { colors, analysisTimeMs } = await extractColorsFromUrl("https://example.com/image.jpg");

// 自定义选项
const { colors } = await extractColorsFromUrl("https://example.com/image.jpg", {
  colorCount: 5, // 提取5种颜色
  maxSize: 150, // 中等采样尺寸
  maxIterations: 25, // 中等迭代次数
});
```

## 使用示例

### 1. 基本使用

```typescript
import {
  extractColorsFromFile,
  extractColorsFromUrl,
} from "./utils/colorExtractor";

// 处理文件
const handleFile = async (file: File) => {
  try {
    const { colors, analysisTimeMs } = await extractColorsFromFile(file);
    console.log("提取的颜色:", colors, "分析耗时:", analysisTimeMs, "ms");

    // 获取主色调
    const primaryColor = colors[0];
    console.log("主色调:", primaryColor.hex);
  } catch (error) {
    console.error("处理失败:", error.message);
  }
};

// 处理URL
const handleUrl = async (url: string) => {
  try {
    const { colors } = await extractColorsFromUrl(url);
    console.log("提取的颜色:", colors);
  } catch (error) {
    console.error("处理失败:", error.message);
  }
};
```

### 2. 批量处理

```typescript
// 批量处理文件
const batchProcessFiles = async (files: File[]) => {
  const results = [];

  for (const file of files) {
    try {
      const { colors } = await extractColorsFromFile(file, {
        colorCount: 3, // 每个文件只提取3种主要颜色
      });
      results.push({ file: file.name, colors });
    } catch (error) {
      console.error(`处理 ${file.name} 失败:`, error.message);
    }
  }

  return results;
};

// 并行处理URL
const parallelProcessUrls = async (urls: string[]) => {
  const promises = urls.map(url => extractColorsFromUrl(url));
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => ({
    url: urls[index],
    success: result.status === "fulfilled",
    colors: result.status === "fulfilled" ? result.value.colors : null,
    error: result.status === "rejected" ? result.reason.message : null,
  }));
};
```

### 3. 颜色结果处理

```typescript
const processColors = (colors: ColorResult[]) => {
  // 获取主色调
  const primaryColor = colors[0];

  // 获取所有HEX值
  const hexColors = colors.map(color => color.hex);

  // 过滤显著颜色（占比>10%）
  const significantColors = colors.filter(
    color => parseFloat(color.percentage) > 10
  );

  // 生成CSS渐变
  const gradient = `linear-gradient(45deg, ${hexColors.join(", ")})`;

  return {
    primaryColor: primaryColor.hex,
    palette: hexColors,
    significantColors,
    cssGradient: gradient,
  };
};
```

## 错误处理

工具会抛出有意义的错误信息：

```typescript
try {
  const { colors } = await extractColorsFromFile(file);
} catch (error) {
  switch (error.message) {
    case "请选择有效的图片文件":
      // 文件类型错误
      break;
    case "图片加载失败":
      // 图片损坏或格式不支持
      break;
    case "下载图片失败: HTTP error! status: 404":
      // URL不存在
      break;
    default:
      console.error("未知错误:", error.message);
  }
}
```

## 性能优化建议

1. **采样大小**: 对于大图片，适当降低 `maxSize` 可以提高处理速度
2. **颜色数量**: 减少 `colorCount` 可以加快聚类计算
3. **迭代次数**: 对于简单图片，可以减少 `maxIterations`
4. **批量处理**: 使用 `Promise.all` 进行并行处理

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

需要支持以下 Web API:

- Canvas API
- Fetch API
- Promise
- URL.createObjectURL

## 注意事项

1. **CORS 限制**: 某些图片 URL 可能因为 CORS 策略无法直接访问，工具会自动尝试下载处理
2. **文件大小**: 建议处理的图片文件不超过 10MB
3. **内存使用**: 大量并行处理可能消耗较多内存，建议控制并发数量
4. **网络请求**: URL 处理依赖网络连接，请确保网络畅通
