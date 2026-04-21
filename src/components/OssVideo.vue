<template>
    <video
        v-if="isAccessible"
        :src="displaySrc"
        :style="style"
        :controls="controls"
        :autoplay="autoplay"
        :muted="muted"
        :loop="loop"
        :poster="poster"
        @error="handleVideoError"
        @loadeddata="handleVideoLoaded"
        @loadstart="handleLoadStart"
    >
        您的浏览器不支持视频播放。
    </video>
    <div
        v-else
        :style="style"
        class="oss-video-error"
    >
        <div class="error-content">
            <el-icon size="48" color="#ccc">
                <VideoCamera />
            </el-icon>
            <span>视频加载失败</span>
            <el-button v-if="originalSrc" type="text" @click="retryLoad">
                重新加载
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { VideoCamera } from '@element-plus/icons-vue';

interface Props {
    src: string;
    style?: any;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    poster?: string;
}

const props = withDefaults(defineProps<Props>(), {
    style: () => ({ width: '100%', maxWidth: '400px' }),
    controls: true,
    autoplay: false,
    muted: false,
    loop: false,
    poster: ''
});

const emit = defineEmits<{
    'error': [event: Event];
    'loadeddata': [event: Event];
    'loadstart': [event: Event];
}>();

const isAccessible = ref(true);
const displaySrc = ref(props.src);
const originalSrc = ref(props.src);
const isLoading = ref(false);

// 将OSS URL转换为代理URL
const convertToProxyUrl = (ossUrl: string): string => {
    try {
        // 如果已经是代理URL，直接返回
        if (ossUrl.includes('/api/proxy/oss')) {
            return ossUrl;
        }

        const url = new URL(ossUrl);
        const path = url.pathname + url.search;
        return `/api/proxy/oss${path}`;
    } catch (error) {
        console.error('转换代理URL失败:', error);
        return ossUrl;
    }
};

// 检查并修复视频URL
const checkAndFixVideoUrl = async (url: string) => {
    isLoading.value = true;

    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            displaySrc.value = url;
            isAccessible.value = true;
        } else {
            if (response.status === 403) {
                const proxyUrl = convertToProxyUrl(url);

                // 测试代理URL是否可访问
                try {
                    const proxyResponse = await fetch(proxyUrl, { method: 'HEAD' });
                    if (proxyResponse.ok) {
                        displaySrc.value = proxyUrl;
                        isAccessible.value = true;
                    } else {
                        isAccessible.value = false;
                    }
                } catch (proxyError) {
                    isAccessible.value = false;
                }
            } else {
                isAccessible.value = false;
            }
        }
    } catch (error) {
        const proxyUrl = convertToProxyUrl(url);
        displaySrc.value = proxyUrl;
        // 仍然设置为可访问，让浏览器尝试加载
        isAccessible.value = true;
    } finally {
        isLoading.value = false;
    }
};

// 处理视频加载错误
const handleVideoError = (event: Event) => {

    // 如果当前URL不是代理URL，尝试代理URL
    if (!displaySrc.value.includes('/api/proxy/oss') && originalSrc.value) {
        const proxyUrl = convertToProxyUrl(originalSrc.value);
        displaySrc.value = proxyUrl;
    } else {
        // 代理URL也失败了，标记为不可访问
        isAccessible.value = false;
        emit('error', event);
    }
};

// 处理视频加载成功
const handleVideoLoaded = (event: Event) => {
    emit('loadeddata', event);
};

// 处理视频开始加载
const handleLoadStart = (event: Event) => {
    emit('loadstart', event);
};

// 重新加载
const retryLoad = () => {
    isAccessible.value = true;
    displaySrc.value = originalSrc.value;
    checkAndFixVideoUrl(originalSrc.value);
};

// 监听src变化
watch(() => props.src, (newSrc) => {
    if (newSrc && newSrc !== originalSrc.value) {
        originalSrc.value = newSrc;
        checkAndFixVideoUrl(newSrc);
    }
}, { immediate: true });

onMounted(() => {
    if (props.src) {
        checkAndFixVideoUrl(props.src);
    }
});
</script>

<style scoped>
.oss-video-error {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    color: #999;
    font-size: 14px;
    border: 1px dashed #ddd;
    min-height: 200px;
}

.error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.error-content span {
    font-size: 16px;
    color: #666;
}

video {
    display: block;
    max-width: 100%;
    height: auto;
}
</style>