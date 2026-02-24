/**
 * 图片颜色提取工具
 * 使用 K-means 聚类算法分析图片的主要颜色
 */

export interface ColorResult {
  hex: string;
  rgb: string;
  r: number;
  g: number;
  b: number;
  percentage: string;
}

export interface ExtractOptions {
  colorCount?: number; // 提取的颜色数量，默认为6
  maxSize?: number; // 图片降采样的最大尺寸，默认为100
  maxIterations?: number; // K-means算法的最大迭代次数，默认为20
}

export interface ExtractResult {
  colors: ColorResult[];
  analysisTimeMs: number; // 仅包含 K-means 分析耗时，不含图片加载
}

class ColorExtractor {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
  }

  // RGB 转 HEX
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
  }

  // 计算颜色距离的平方（避免 sqrt，比较时等价且更快）
  private colorDistanceSq(c1: number[], c2: number[]): number {
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return dr * dr + dg * dg + db * db;
  }

  // 计算每个像素到最近中心的距离平方
  private minDistancesToCenters(pixels: number[][], centers: number[][]): number[] {
    return pixels.map(p =>
      Math.min(...centers.map(center => this.colorDistanceSq(p, center)))
    );
  }

  // 按距离加权随机选择下一个中心（K-means++ 核心步骤）
  private weightedRandomPick(pixels: number[][], distances: number[]): number[] {
    const total = distances.reduce((a, b) => a + b, 0);
    if (total === 0) {
      return [...pixels[Math.floor(Math.random() * pixels.length)]];
    }
    let r = Math.random() * total;
    for (let i = 0; i < pixels.length; i++) {
      r -= distances[i];
      if (r <= 0) return [...pixels[i]];
    }
    return [...(pixels.at(-1) ?? pixels[0])];
  }

  // K-means++ 初始化：选择彼此距离较远的初始中心，收敛更快
  private kMeansPlusPlusInit(pixels: number[][], k: number): number[][] {
    const centers: number[][] = [];
    centers.push([...pixels[Math.floor(Math.random() * pixels.length)]]);

    for (let c = 1; c < k; c++) {
      const distances = this.minDistancesToCenters(pixels, centers);
      centers.push(this.weightedRandomPick(pixels, distances));
    }
    return centers;
  }

  // 分配像素到最近中心，返回 assignments 和 clusterSizes
  private assignPixelsToCenters(
    pixels: number[][],
    centers: number[][],
    k: number
  ): { assignments: Int32Array; clusterSizes: number[] } {
    const clusterSizes = new Array<number>(k).fill(0);
    const assignments = new Int32Array(pixels.length);
    for (let p = 0; p < pixels.length; p++) {
      const pixel = pixels[p];
      let minDistSq = Infinity;
      let closest = 0;
      for (let i = 0; i < k; i++) {
        const d = this.colorDistanceSq(pixel, centers[i]);
        if (d < minDistSq) {
          minDistSq = d;
          closest = i;
        }
      }
      assignments[p] = closest;
      clusterSizes[closest]++;
    }
    return { assignments, clusterSizes };
  }

  // 根据分配结果更新聚类中心
  private updateCenters(
    pixels: number[][],
    assignments: Int32Array,
    clusterSizes: number[],
    oldCenters: number[][],
    k: number
  ): number[][] {
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    for (let p = 0; p < pixels.length; p++) {
      const pixel = pixels[p];
      const c = assignments[p];
      sums[c][0] += pixel[0];
      sums[c][1] += pixel[1];
      sums[c][2] += pixel[2];
    }
    return sums.map((sum, i) =>
      clusterSizes[i] > 0
        ? [
            Math.round(sum[0] / clusterSizes[i]),
            Math.round(sum[1] / clusterSizes[i]),
            Math.round(sum[2] / clusterSizes[i]),
          ]
        : oldCenters[i]
    );
  }

  // K-means 聚类算法
  private kMeansClustering(
    pixels: number[][],
    k: number = 5,
    maxIterations: number = 20
  ) {
    if (pixels.length === 0) return [];
    k = Math.min(k, pixels.length);

    const CONVERGE_THRESHOLD_SQ = 25;
    let centers = this.kMeansPlusPlusInit(pixels, k);
    let clusterSizes: number[] = [];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const result = this.assignPixelsToCenters(pixels, centers, k);
      clusterSizes = result.clusterSizes;
      const newCenters = this.updateCenters(
        pixels,
        result.assignments,
        clusterSizes,
        centers,
        k
      );

      const converged = centers.every(
        (c, i) => this.colorDistanceSq(c, newCenters[i]) <= CONVERGE_THRESHOLD_SQ
      );
      centers = newCenters;
      if (converged) break;
    }

    return centers
      .map((color, i) => ({
        color,
        percentage: (clusterSizes[i] / pixels.length) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  // 提取图片主要颜色
  async extractColors(
    imageElement: HTMLImageElement,
    options: ExtractOptions = {}
  ): Promise<ColorResult[]> {
    const { colorCount = 6, maxSize = 100, maxIterations = 20 } = options;

    // 设置 canvas 尺寸（限制最大边，且不放大小于 maxSize 的图片）
    const scale = Math.min(
      maxSize / imageElement.width,
      maxSize / imageElement.height,
      1
    );
    const width = Math.floor(imageElement.width * scale);
    const height = Math.floor(imageElement.height * scale);

    this.canvas.width = width;
    this.canvas.height = height;

    // 绘制图片
    this.ctx.drawImage(imageElement, 0, 0, width, height);

    // 获取像素数据
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 提取 RGB 值
    const pixels: number[][] = [];
    for (let i = 0; i < data.length; i += 4) {
      // 跳过透明像素
      if (data[i + 3] > 0) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }
    }

    // 使用 K-means 聚类提取主要颜色
    const colorResults = this.kMeansClustering(
      pixels,
      colorCount,
      maxIterations
    );

    return colorResults.map(item => ({
      hex: this.rgbToHex(item.color[0], item.color[1], item.color[2]),
      rgb: `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`,
      r: item.color[0],
      g: item.color[1],
      b: item.color[2],
      percentage: item.percentage.toFixed(1),
    }));
  }
}

// 单例实例
const colorExtractor = new ColorExtractor();

// 加载图片的辅助函数
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
};

// 下载图片的辅助函数
const downloadImage = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url, {
      mode: "cors",
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // 检查是否为图片类型
    if (!blob.type.startsWith("image/")) {
      throw new Error("下载的文件不是图片格式");
    }

    return blob;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`下载图片失败: ${msg}`);
  }
};

/**
 * 从文件提取颜色
 * @param file - 图片文件
 * @param options - 提取选项
 * @returns Promise<ExtractResult> - 颜色结果及分析耗时（不含图片加载）
 */
export const extractColorsFromFile = async (
  file: File,
  options: ExtractOptions = {}
): Promise<ExtractResult> => {
  try {
    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      throw new Error("请选择有效的图片文件");
    }

    // 创建图片URL
    const imageUrl = URL.createObjectURL(file);

    try {
      // 加载图片（不计入分析耗时）
      const img = await loadImage(imageUrl);

      // 仅对 K-means 分析计时
      const startTime = performance.now();
      const colors = await colorExtractor.extractColors(img, options);
      const analysisTimeMs = Math.round(performance.now() - startTime);

      return { colors, analysisTimeMs };
    } finally {
      // 清理URL对象
      URL.revokeObjectURL(imageUrl);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`文件处理失败: ${msg}`);
  }
};

/**
 * 从URL下载图片并提取颜色
 * @param url - 图片URL地址
 * @param options - 提取选项
 * @returns Promise<ExtractResult> - 颜色结果及分析耗时（不含图片加载）
 */
export const extractColorsFromUrl = async (
  url: string,
  options: ExtractOptions = {}
): Promise<ExtractResult> => {
  try {
    // 验证URL格式
    try {
      new URL(url);
    } catch {
      throw new Error("请提供有效的URL地址");
    }

    const runExtract = async (img: HTMLImageElement) => {
      const startTime = performance.now();
      const colors = await colorExtractor.extractColors(img, options);
      const analysisTimeMs = Math.round(performance.now() - startTime);
      return { colors, analysisTimeMs };
    };

    // 尝试直接加载图片（适用于支持CORS的图片）
    try {
      const img = await loadImage(url);
      return runExtract(img);
    } catch (corsError) {
      // 如果直接加载失败，尝试下载后处理
      console.warn("直接加载失败，尝试下载图片:", corsError.message);

      // 下载图片
      const blob = await downloadImage(url);

      // 创建本地URL
      const localUrl = URL.createObjectURL(blob);

      try {
        const img = await loadImage(localUrl);
        return runExtract(img);
      } finally {
        URL.revokeObjectURL(localUrl);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`URL处理失败: ${msg}`);
  }
};

// 默认导出工具类（用于高级用法）
export default ColorExtractor;
