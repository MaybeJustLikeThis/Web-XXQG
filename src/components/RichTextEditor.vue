<template>
    <div class="rich-text-editor">
        <div style="border: 1px solid #ccc">
            <Toolbar
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                :mode="mode"
            />
            <Editor
                :style="{ height: height + 'px', overflowY: 'hidden' }"
                v-model="modelValue"
                :defaultConfig="editorConfig"
                :mode="mode"
                @onCreated="handleCreated"
                @onChange="handleChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import { ElMessage } from 'element-plus';
import { uploadFile } from '@/utils/upload';

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// Props
interface Props {
    modelValue: string;
    height?: number;
    mode?: 'default' | 'simple';
    placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
    height: 400,
    mode: 'default',
    placeholder: '请输入内容...'
});

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: string];
    'change': [value: string];
    'created': [editor: any];
}>();


// 自定义图片上传函数
const customUploadImage = async (file: File, insertFn: Function) => {
    try {
        const imageUrl = await uploadFile(file);
        insertFn(imageUrl, file.name, imageUrl);
    } catch (error) {
        ElMessage.error('图片上传失败');
    }
};

// 自定义视频上传函数
const customUploadVideo = async (file: File, insertFn: Function) => {
    try {
        const videoUrl = await uploadFile(file);
        insertFn(videoUrl, file.name, videoUrl);
    } catch (error) {
        ElMessage.error('视频上传失败');
    }
};

// 编辑器配置
const toolbarConfig = {
    toolbarKeys: [
        'headerSelect',
        'bold',
        'italic',
        'underline',
        'through',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'indent',
        'delIndent',
        'insertLink',
        'uploadImage',
        'insertVideo',
        'insertTable',
        'codeBlock',
        'divider',
        'undo',
        'redo',
    ],
};

const editorConfig = {
    placeholder: props.placeholder,
    MENU_CONF: {
        uploadImage: {
            customUpload: customUploadImage,
        },
        uploadVideo: {
            customUpload: customUploadVideo,
        },
    },
};

// 编辑器创建回调
const handleCreated = (editor: any) => {
    editorRef.value = editor;
    emit('created', editor);
};

// 编辑器内容变化回调
const handleChange = (editor: any) => {
    const html = editor.getHtml();
    emit('update:modelValue', html);
    emit('change', html);
};

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
    if (editorRef.value && newValue !== editorRef.value.getHtml()) {
        editorRef.value.setHtml(newValue);
    }
});

// 组件销毁时，销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (editor == null) return;
    editor.destroy();
});
</script>

<style scoped>
.rich-text-editor {
    width: 100%;
}
</style>