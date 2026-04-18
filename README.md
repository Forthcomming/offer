# 求职申请管理看板

Next.js（App Router）+ React + TypeScript + Tailwind。数据默认存于浏览器 `localStorage`。

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。若 PowerShell 拦截 `npm` 脚本，可使用 `npm.cmd`。

## 每日 AI 资讯（RSS）

首页「每日 AI 资讯」由 `GET /api/news` 聚合多个公开 RSS（内置轻量 XML 解析，无额外 npm 依赖）。需本机可访问外网；部分源在网络受限时可能失败，界面会提示「部分来源未加载」。

## 邮箱中心

`/email` 提供演示同步与粘贴解析流程，当前不连接真实 IMAP/API。解析规则见 `lib/email/parseEmail.ts`。

## 测试

```bash
npm test
```
