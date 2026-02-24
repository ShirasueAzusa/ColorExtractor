/**
 * 颜色提取工具使用示例
 */

import {
  extractColorsFromFile,
  extractColorsFromUrl,
  type ColorResult,
  type ExtractOptions,
} from "../utils/colorExtractor";

// 示例1: 从文件提取颜色
export const exampleExtractFromFile = async (file: File): Promise<void> => {
  try {
    console.log("开始从文件提取颜色...");

    // 基本用法
    const { colors } = await extractColorsFromFile(file);
    console.log("提取的颜色:", colors);

    // 自定义选项
    const customOptions: ExtractOptions = {
      colorCount: 8, // 提取8种颜色
      maxSize: 200, // 更大的采样尺寸
      maxIterations: 30, // 更多迭代次数
    };

    const { colors: customColors } = await extractColorsFromFile(
      file,
      customOptions,
    );
    console.log("自定义选项提取的颜色:", customColors);
  } catch (error) {
    console.error("文件处理错误:", error.message);
  }
};

// 示例2: 从URL提取颜色
export const exampleExtractFromUrl = async (url: string): Promise<void> => {
  try {
    console.log("开始从URL提取颜色...");

    // 基本用法
    const { colors } = await extractColorsFromUrl(url);
    console.log("提取的颜色:", colors);

    // 自定义选项
    const customOptions: ExtractOptions = {
      colorCount: 5, // 提取5种颜色
      maxSize: 150, // 中等采样尺寸
      maxIterations: 25, // 中等迭代次数
    };

    const { colors: customColors } = await extractColorsFromUrl(
      url,
      customOptions,
    );
    console.log("自定义选项提取的颜色:", customColors);
  } catch (error) {
    console.error("URL处理错误:", error.message);
  }
};

// 示例3: 批量处理多个文件
export const exampleBatchProcessFiles = async (
  files: File[],
): Promise<ColorResult[][]> => {
  const results: ColorResult[][] = [];

  for (const file of files) {
    try {
      console.log(`处理文件: ${file.name}`);
      const { colors } = await extractColorsFromFile(file, {
        colorCount: 3, // 每个文件提取3种主要颜色
        maxSize: 100,
      });
      results.push(colors);
      console.log(`${file.name} 处理完成:`, colors);
    } catch (error) {
      console.error(`处理文件 ${file.name} 失败:`, error.message);
      results.push([]); // 失败时添加空数组
    }
  }

  return results;
};

// 示例4: 批量处理多个URL
export const exampleBatchProcessUrls = async (
  urls: string[],
): Promise<ColorResult[][]> => {
  // 并行处理所有URL
  const promises = urls.map(async (url, index) => {
    try {
      console.log(`处理URL ${index + 1}: ${url}`);
      const { colors } = await extractColorsFromUrl(url, {
        colorCount: 4,
        maxSize: 120,
      });
      console.log(`URL ${index + 1} 处理完成:`, colors);
      return colors;
    } catch (error) {
      console.error(`处理URL ${index + 1} 失败:`, error.message);
      return []; // 失败时返回空数组
    }
  });

  const results = await Promise.all(promises);
  return results;
};

// 示例5: 颜色结果处理工具函数
export const processColorResults = (colors: ColorResult[]) => {
  // 获取主色调（占比最高的颜色）
  const primaryColor = colors[0];
  console.log("主色调:", primaryColor);

  // 获取所有颜色的HEX值
  const hexColors = colors.map(color => color.hex);
  console.log("所有HEX颜色:", hexColors);

  // 获取占比超过10%的颜色
  const significantColors = colors.filter(
    color => Number.parseFloat(color.percentage) > 10,
  );
  console.log("显著颜色:", significantColors);

  // 计算平均RGB值
  const avgRgb = colors.reduce(
    (acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  avgRgb.r = Math.round(avgRgb.r / colors.length);
  avgRgb.g = Math.round(avgRgb.g / colors.length);
  avgRgb.b = Math.round(avgRgb.b / colors.length);

  console.log("平均RGB值:", avgRgb);

  return {
    primaryColor,
    hexColors,
    significantColors,
    averageRgb: avgRgb,
  };
};

// 使用示例
export const runExamples = async () => {
  console.log("=== 颜色提取工具使用示例 ===");

  // 示例URL（请确保这些URL可访问）
  const testUrls = [
    "https://picsum.photos/300/200?random=1",
    "https://picsum.photos/300/200?random=2",
  ];

  // 从URL提取颜色
  for (const url of testUrls) {
    await exampleExtractFromUrl(url);
  }

  // 批量处理URL
  const batchResults = await exampleBatchProcessUrls(testUrls);
  console.log("批量处理结果:", batchResults);

  // 处理第一个结果
  if (batchResults[0] && batchResults[0].length > 0) {
    const processed = processColorResults(batchResults[0]);
    console.log("处理后的结果:", processed);
  }
};
