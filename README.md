# 极简网址导航（全新开发）

这是独立新项目，不依赖之前的 nav 仓库。前台采用无搜索框、无图标、纯文字卡片布局，电脑端左侧分类栏 + 四列卡片，手机端自动变为双列。后台可以管理分类和网址，并通过 Netlify Blobs 持久保存数据。

## 部署到 Netlify

1. 将本项目全部文件上传到一个新的 GitHub 仓库（上传解压后的文件，不要只上传 ZIP）。
2. 在 Netlify 选择 Add new project / Import an existing project，连接该仓库。
3. 构建配置：Build command `npm run build`；Publish directory `.`；Functions directory `netlify/functions`。
4. 在 Netlify 项目设置的 Environment variables 中添加：
   - `ADMIN_PASSWORD`：设置一个强管理员密码（不要使用示例密码）。
   - `SESSION_SECRET`：设置一段随机、足够长的秘密字符串。
5. 重新部署（Deploy）。
6. 访问 `https://你的域名/admin.html` 登录后台。

## 数据保存说明

网址与分类保存在 Netlify Blobs 的 `nav-data` store 中，不会只保存在访问者浏览器里。后台保存成功后，前台刷新即可读取最新数据。Netlify Functions/Blobs 需要在 Netlify 部署环境中运行；仅双击本地 HTML 文件不会连接云端数据。

## 初始分类

首次访问 API 时会自动初始化：常用、免费图床、娱乐影音、社交社区、实用工具。初始网址为空，可在后台添加。

## 安全提示

- 必须配置 `ADMIN_PASSWORD` 和 `SESSION_SECRET`。
- 请勿把密码、令牌写入前端文件或公开仓库。
- 后台使用 HttpOnly、Secure、SameSite=Strict Cookie 会话；生产站点应使用 HTTPS。
