<script setup lang="ts">
import { ref } from "vue";
import {
  extractColorsFromFile,
  extractColorsFromUrl,
  type ColorResult,
} from "./utils/colorExtractor";

// 响应式数据
const imageUrl = ref("");
const imageFile = ref<File | null>(null);
const isLoading = ref(false);
const errorMsg = ref("");
const showError = ref(false);
const showImagePreview = ref(false);
const previewImgSrc = ref("");
const showColorsResult = ref(false);
const colors = ref<ColorResult[]>([]);
const analysisTimeMs = ref<number | null>(null);
const toastMsg = ref("");
const showToast = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);

// 显示错误信息
const showErrorMessage = (message: string) => {
  errorMsg.value = message;
  showError.value = true;
  setTimeout(() => {
    showError.value = false;
  }, 5000);
};

// 显示提示信息
const showToastMessage = (message: string) => {
  toastMsg.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// 分析图片
const analyzeImage = async () => {
  // 检查输入
  if (!imageUrl.value && !imageFile.value) {
    showErrorMessage("请输入图片URL或选择本地图片");
    return;
  }

  try {
    // 显示加载状态
    isLoading.value = true;
    showColorsResult.value = false;

    let result: { colors: ColorResult[]; analysisTimeMs: number };
    let imageSource: string;

    // 根据输入类型选择不同的处理方式
    if (imageFile.value) {
      result = await extractColorsFromFile(imageFile.value, {
        colorCount: 6,
        maxSize: 100,
        maxIterations: 20,
      });
      imageSource = URL.createObjectURL(imageFile.value);
    } else if (imageUrl.value) {
      result = await extractColorsFromUrl(imageUrl.value, {
        colorCount: 6,
        maxSize: 100,
        maxIterations: 20,
      });
      imageSource = imageUrl.value;
    } else {
      throw new Error("未选择有效的图片");
    }

    // 显示预览
    previewImgSrc.value = imageSource;
    showImagePreview.value = true;

    // 设置颜色结果及分析耗时（仅 K-means 分析，不含图片加载）
    colors.value = result.colors;
    analysisTimeMs.value = result.analysisTimeMs;

    // 隐藏加载状态
    isLoading.value = false;
    showColorsResult.value = true;

    showToastMessage("色调分析完成！点击颜色可复制");
  } catch (error: any) {
    console.error("Error:", error);
    isLoading.value = false;
    showErrorMessage("分析失败：" + error.message);
  }
};

// 清除结果
const clearResults = () => {
  imageUrl.value = "";
  imageFile.value = null;
  showImagePreview.value = false;
  showColorsResult.value = false;
  analysisTimeMs.value = null;
  showError.value = false;

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// 复制颜色值
const copyColor = async (hex: string) => {
  try {
    await navigator.clipboard.writeText(hex);
    showToastMessage(`已复制 ${hex}`);
  } catch (err) {
    console.error("复制失败:", err);
  }
};

// 处理文件选择
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    imageFile.value = target.files[0];
    imageUrl.value = "";
  }
};

// Enter 键触发分析
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    analyzeImage();
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 sm:p-8"
  >
    <div class="card bg-base-100 w-full max-w-3xl shadow-2xl">
      <div class="card-body">
        <div class="text-center mb-6">
          <h1
            class="text-3xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            图片主副色调提取器
          </h1>
          <p class="text-base-content/60 mt-2">
            使用 K-means 聚类算法分析图片的主要颜色
          </p>
        </div>

        <div class="space-y-4">
          <div class="form-control w-full">
            <label class="label" for="image-url-input">
              <span class="label-text font-medium">图片 URL 地址：</span>
            </label>
            <input
              id="image-url-input"
              type="text"
              v-model="imageUrl"
              placeholder="输入图片 URL，如: https://example.com/image.jpg"
              class="input input-bordered focus:input-primary w-full"
              @keypress="handleKeyPress"
              :disabled="isLoading"
            />
          </div>

          <div class="divider">或者</div>

          <div class="form-control w-full">
            <label class="label" for="image-file-input">
              <span class="label-text font-medium">选择本地图片：</span>
            </label>
            <input
              id="image-file-input"
              type="file"
              ref="fileInputRef"
              accept="image/*"
              class="file-input file-input-bordered file-input-primary w-full"
              @change="handleFileChange"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="card-actions justify-center mt-8 gap-4">
          <button
            class="btn btn-primary flex-1 sm:flex-none sm:w-40"
            @click="analyzeImage"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading loading-spinner"></span>
            {{ isLoading ? "分析中..." : "分析图片色调" }}
          </button>
          <button
            class="btn btn-outline flex-1 sm:flex-none sm:w-40"
            @click="clearResults"
            :disabled="isLoading"
          >
            清除结果
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="showError" class="alert alert-error mt-6 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ errorMsg }}</span>
        </div>

        <!-- 图片预览 -->
        <div v-if="showImagePreview" class="mt-8 flex justify-center">
          <div class="avatar">
            <div class="w-full max-w-md rounded-xl shadow-lg overflow-hidden">
              <img :src="previewImgSrc" alt="预览图片" class="object-contain" />
            </div>
          </div>
        </div>

        <!-- 提取的色调 -->
        <div v-if="showColorsResult" class="mt-8 animate-fade-in">
          <div class="text-center mb-4">
            <h3 class="text-xl font-semibold">提取的色调</h3>
            <p
              v-if="analysisTimeMs !== null"
              class="text-sm text-base-content/50 mt-1"
            >
              分析耗时 {{ analysisTimeMs }} ms
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(color, index) in colors"
              :key="index"
              class="group relative card bg-base-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border border-base-200"
              :class="{ 'col-span-2 md:col-span-4': index === 0 }"
              @click="copyColor(color.hex)"
            >
              <figure class="px-3 pt-3">
                <div
                  class="w-full rounded-xl relative overflow-hidden"
                  :class="index === 0 ? 'h-32' : 'h-24'"
                  :style="{ backgroundColor: color.hex }"
                >
                  <div
                    class="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors duration-300"
                  >
                    <span
                      class="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md"
                      >点击复制</span
                    >
                  </div>
                  <div
                    class="absolute top-2 right-2 badge glass border-none text-neutral-800 bg-white/40 shadow-sm font-bold"
                  >
                    {{ color.percentage }}%
                  </div>
                </div>
              </figure>
              <div class="card-body p-4 items-center text-center">
                <div
                  class="text-xs text-base-content/50 uppercase tracking-widest font-semibold mb-1"
                >
                  {{ index === 0 ? "主色调" : `副色调 ${index}` }}
                </div>
                <div class="font-mono text-lg font-bold text-base-content">
                  {{ color.hex }}
                </div>
                <div class="text-xs text-base-content/60">
                  {{ color.rgb }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div class="toast toast-center sm:toast-end z-50">
      <div
        v-if="showToast"
        class="alert alert-success shadow-lg animate-slide-up text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ toastMsg }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义动画辅助类 */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
