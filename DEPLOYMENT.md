# 上传与发布说明

源码仓库保留网页入口、样式、src、assets、测试、工具和产品交付文档。两份单文件预览用于离线展示。artifacts 截图缓存、环境变量、依赖目录、日志、site-dist 生成目录和外层提交包无需上传。

## GitHub Pages

仓库 Settings → Pages → Source 选择 GitHub Actions，然后在 Actions 中运行 Test and deploy GitHub Pages。后续推送 main 会先测试再发布。部署成功后访问 https://httt2333.github.io/orderhealthtake/ 。仓库上传成功与网页部署成功应分别确认。

本项目无需安装依赖或填写密钥。npm run build 将 index.html、styles.css、src、assets 复制到 site-dist；只发布这些网页运行资源，研究文档和开发记录保留在仓库中。相对资源路径和 hash 路由支持仓库子路径。

## 展示验收

检查首页、添加安排、包装示例、核对保存、今天用药、照片放大及家属比对。真实手机上需另验收相机、语音和通知授权。语音识别依赖 HTTPS、浏览器支持及授权，部分浏览器使用自身在线识别服务；朗读依赖设备音色。

数据保存在当前站点浏览器 localStorage，无账户同步或后端备份。提醒只在页面保持打开且可见时检查。包装识别结果是预置演示，未连接真实 OCR 或模型；不要录入真实患者敏感信息。演示图片由提交者提供，项目尚未声明开源许可证。
