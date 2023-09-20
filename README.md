# 介绍
一个webrtc相关的多包仓库，以core包延伸功能，每一个功能组即是一个npm包

[文档](magic-webrtc-docs.test.abmao.com)

# 项目操作
采用pnpm管理依赖，lerna只用来做版本升级与发布

发布包命令（打包&版本升级&发布）
```
pnpm run release
```
## pnpm具体使用
安装依赖管理器
```
npm i -g pnpm
```
常用命令
```
pnpm add <pacakge> -w // 为根目录安装依赖
pnpm add <package> --filter '项目包name' // 为项目包添加依赖
```

