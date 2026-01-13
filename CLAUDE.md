# FixPic 项目文档

## 项目概述

FixPic 是一个免费在线图片处理工具网站，提供以下功能：
- AI 智能抠图 (ai-remove-background)
- AI 去水印 (remove-watermark)
- 去假透明背景 (remove-fake-transparency)
- 图片压缩 (compress)
- 图片调整尺寸 (resize)

**线上地址**: https://fix-pic.com
**部署平台**: Cloudflare Pages

## 技术栈

- **前端**: React + TypeScript + Vite
- **样式**: TailwindCSS
- **路由**: React Router
- **国际化**: 自定义 i18n 方案（22 种语言）
- **后端 API**: Cloudflare Pages Functions
- **错误监控**: Sentry
- **分析**: Google Analytics (G-6GK9T6FE75)

## 目录结构

```
fixpic/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── i18n/              # 多语言翻译文件
│   └── main.tsx           # 入口文件
├── functions/             # Cloudflare Pages Functions (API)
│   └── api/
│       ├── remove-watermark.ts    # 去水印 API
│       ├── remove-background.ts   # 抠图 API
│       └── ...
├── public/                # 静态资源
│   └── sitemap*.xml
└── scripts/               # 构建脚本
```

## 支持的语言 (22种)

en, zh-CN, zh-TW, ja, ko, es, pt, fr, de, it, ru, vi, th, id, ms, tr, nl, el, cs, hu, uk, ar

## 外部 API 依赖

### 1. Dewatermark.ai (去水印)
- **用途**: AI 去水印功能
- **API 端点**: `https://platform.dewatermark.ai/api/object_removal/v2/erase_watermark`
- **认证**: X-API-KEY header
- **环境变量**: `DEWATERMARK_API_KEY`
- **后台管理**: https://dewatermark.ai (登录后进入 API Management)
- **注意**: 按量计费，需定期检查余额
- **状态**: 正常工作 (2026-01-13 已验证)

### 2. Remove.bg 或类似服务 (抠图)
- **环境变量**: 检查 Cloudflare 环境变量配置

## 部署流程

```bash
# 本地开发
npm run dev

# 构建
npm run build

# 部署到 Cloudflare Pages (生产环境)
npx wrangler pages deploy dist --project-name=fixpic --branch=main
```

**重要**: 必须使用 `--branch=main` 才能部署到生产环境 (fix-pic.com)。
- `--branch=main` → Production 环境 → fix-pic.com
- `--branch=master` 或不指定 → Preview 环境 → 只生成预览链接，不更新正式域名

## 环境变量 (Cloudflare)

需要在 Cloudflare Pages 设置以下环境变量：
- `DEWATERMARK_API_KEY` - Dewatermark.ai API 密钥
- 其他 API 密钥...

## 经验教训

### 1. API 余额监控
- Dewatermark.ai API 按量计费，余额耗尽会导致 "Insufficient Balance" 错误
- 建议：定期检查余额，设置 Sentry 告警

### 2. API 调试注意事项 (2026-01-13 教训)
- **问题**: Sentry 报告去水印 API 500 错误，调试时误判为 API 端点/认证问题
- **实际原因**:
  1. test_images 目录中部分测试图片是空文件或损坏文件（如 shutterstock_test.jpg 为 0 字节）
  2. 使用无效测试文件导致 API 返回错误，误以为是服务端问题
  3. Dewatermark API 偶尔会有短暂的 500 错误（服务不稳定）
- **教训**:
  1. 调试前先验证测试数据有效性（`ls -la` 检查文件大小，`file` 命令检查文件类型）
  2. 不要急于修改 API 端点/认证方式，先用已知有效的数据测试
  3. Sentry 报告的偶发 500 错误可能是第三方服务的临时问题，需要多次测试确认
  4. 保持测试文件的有效性，定期清理无效的测试数据

### 3. 多语言处理
- 翻译文件位于 `src/i18n/locales/{lang}.json`
- hreflang 标签在组件中动态生成

### 4. Cloudflare Pages Functions
- API 函数位于 `functions/api/` 目录
- 文件名即路由: `remove-watermark.ts` -> `/api/remove-watermark`
- 环境变量通过 `context.env` 访问

### 5. Sentry 错误监控
- 已配置 Sentry 用于捕获前端和 API 错误
- 收到错误邮件时检查具体错误类型和位置

### 6. Cloudflare Pages 部署分支
- **问题**: 部署后线上没有更新，预览链接正常但 fix-pic.com 不变
- **原因**: Cloudflare Pages 区分 Production 和 Preview 环境
  - 本地 git 分支是 `master`，但 Cloudflare Pages 生产分支配置为 `main`
  - 不指定 `--branch` 或使用 `--branch=master` 会部署到 Preview 环境
  - 只有 `--branch=main` 才会部署到 Production 环境
- **解决**: 始终使用 `npx wrangler pages deploy dist --project-name=fixpic --branch=main`
- **验证**: 部署后检查 `curl -s "https://fix-pic.com/" | grep -o 'index-[^"]*\.js'` 确认 JS 文件 hash 已更新

## 常用命令

```bash
# 开发
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 预览构建结果
npm run preview

# 部署
npm run deploy
```

## 待办/未来计划

- [ ] 优化图片处理性能
- [ ] 添加用户反馈收集
- [ ] 考虑添加更多图片工具

## 联系方式

- 网站: https://fix-pic.com
- Sentry: 查看 Cloudflare 环境变量中的 DSN
