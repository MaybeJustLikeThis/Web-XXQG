# Element Plus 组件用法备忘录

## 表单组件
```vue
<el-form ref="formRef" :rules="rules" :model="form" label-width="120px" :label-position="labelPosition">
    <el-form-item label="文本框" prop="name">
        <el-input v-model="form.name"></el-input>
    </el-form-item>
    <el-form-item label="数字框" prop="num">
        <el-input-number v-model="form.num" :min="1" :max="10" />
    </el-form-item>
    <el-form-item label="日期选择" prop="date">
        <el-date-picker type="date" placeholder="选择日期" v-model="form.date"></el-date-picker>
    </el-form-item>
    <el-form-item label="时间选择" prop="time">
        <el-time-picker placeholder="选择时间" v-model="form.time"></el-time-picker>
    </el-form-item>
    <el-form-item label="选择器" prop="region">
        <el-select v-model="form.region" placeholder="请选择">
            <el-option key="key1" label="标签1" value="值1"></el-option>
        </el-select>
    </el-form-item>
    <el-form-item label="开关" prop="delivery">
        <el-switch v-model="form.delivery"></el-switch>
    </el-form-item>
    <el-form-item label="多选框" prop="type">
        <el-checkbox-group v-model="form.type">
            <el-checkbox key="type1" label="类型1"></el-checkbox>
        </el-checkbox-group>
    </el-form-item>
    <el-form-item label="单选框" prop="resource">
        <el-radio-group v-model="form.resource">
            <el-radio key="res1" label="选项1"></el-radio>
        </el-radio-group>
    </el-form-item>
    <el-form-item label="文本域" prop="desc">
        <el-input type="textarea" v-model="form.desc"></el-input>
    </el-form-item>
    <el-form-item>
        <el-button type="primary" @click="submitForm(formRef)">创建</el-button>
        <el-button @click="resetForm(formRef)">重置</el-button>
    </el-form-item>
</el-form>
```

## 表格组件
```vue
<el-table :data="tableData" border style="width: 100%">
    <el-table-column prop="date" label="日期" width="180" />
    <el-table-column prop="name" label="姓名" width="180" />
    <el-table-column prop="address" label="地址" />
    <el-table-column fixed="right" label="操作" width="120">
        <template #default="scope">
            <el-button link type="primary" size="small" @click="handleClick(scope)">编辑</el-button>
        </template>
    </el-table-column>
</el-table>
```

## 上传组件
```vue
<el-upload
    class="upload-demo"
    drag
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
>
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
</el-upload>
```

## 图标组件
```vue
<el-icon><User /></el-icon>
<el-icon size="large"><Setting /></el-icon>
```

## 日期选择器
```vue
<el-calendar v-model="value" />
<el-date-picker v-model="value" type="date" placeholder="选择日期" />
<el-time-picker v-model="value" placeholder="选择时间" />
```

## 步骤条
```vue
<el-steps :active="active" finish-status="success">
    <el-step title="步骤 1" description="描述1" />
    <el-step title="步骤 2" description="描述2" />
    <el-step title="步骤 3" description="描述3" />
</el-steps>
```

## 走马灯
```vue
<el-carousel height="150px">
    <el-carousel-item v-for="item in 4" :key="item">
        <h3 class="small justify-center" text="2xl">{{ item }}</h3>
    </el-carousel-item>
</el-carousel>
```

## 标签页
```vue
<el-tabs v-model="activeName">
    <el-tab-pane label="用户管理" name="first">用户管理</el-tab-pane>
    <el-tab-pane label="配置管理" name="second">配置管理</el-tab-pane>
    <el-tab-pane label="角色管理" name="third">角色管理</el-tab-pane>
</el-tabs>
```

## 统计组件
```vue
<el-statistic title="活跃用户" :value="268500" />
<el-statistic :value="value" :title="title" />
```

## 水印
```vue
<el-watermark content="水印内容">
    <div style="height: 500px">内容区域</div>
</el-watermark>
```

## 图表组件
```vue
<!-- ECharts -->
<v-chart class="chart" :option="chartOption" />

<!-- Schart -->
<schart class="wrapper" :canvasId="canvasId" :type="type" :data="data" />
```

## 富文本编辑器
```vue
<template>
    <div style="border: 1px solid #ccc">
        <Toolbar
            style="border-bottom: 1px solid #ccc"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            mode="default"
        />
        <Editor
            style="height: 500px; overflow-y: hidden;"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
            mode="default"
            @onCreated="handleCreated"
        />
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const editorRef = shallowRef()
const valueHtml = ref('<p>hello</p>')

const toolbarConfig = { }
const editorConfig = { placeholder: '请输入内容...' }

const handleCreated = (editor) => { editorRef.value = editor }

onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})
</script>
```

## Markdown编辑器
```vue
<template>
    <MdEditor v-model="text" height="500px" />
</template>

<script setup>
import { ref } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const text = ref('# Hello Editor')
</script>
```

## Excel导入导出
```vue
<!-- 导入 -->
<el-upload
    class="upload-demo"
    action=""
    :on-change="handleChange"
    :auto-upload="false"
    accept=".xlsx, .xls"
>
    <el-button type="primary">导入Excel</el-button>
</el-upload>

<!-- 导出 -->
<el-button type="primary" @click="exportExcel">导出Excel</el-button>

<script>
import * as XLSX from 'xlsx'

const exportExcel = () => {
    const data = [
        ['姓名', '年龄', '地址'],
        ['张三', 25, '北京'],
        ['李四', 30, '上海']
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "数据")
    XLSX.writeFile(wb, "data.xlsx")
}
</script>
```