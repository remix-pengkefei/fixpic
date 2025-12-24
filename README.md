# FixPic

AI 开发者的图片工具箱，纯前端处理，图片不上传服务器。

## 功能

### 1. 去除假透明背景
将 Lovart、Midjourney 等 AI 工具导出的假透明背景（灰白棋盘格）转换为真正的透明 PNG。

**原理：**
- 从图片四角采样，自动检测背景颜色
- 识别灰白色且 RGB 值相近的像素
- 将这些像素设为透明

### 2. 图片压缩转换
压缩图片并转换格式，支持：
- 输出格式：WebP、PNG、JPEG
- 自定义质量（1-100%）
- 限制最大宽度（自动等比缩放）
- 批量处理

## 技术栈

- React 19 + TypeScript
- Vite
- Canvas API（纯前端图片处理）

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署

构建后的 `dist` 目录可以部署到任何静态托管服务：
- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages
