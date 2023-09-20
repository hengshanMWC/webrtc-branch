import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'magic-webrtc',
  description: 'webrtc生态',
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '../assets/images/logo.png' }]
  ],
  themeConfig: {
    siteTitle: 'magic-webrtc',
    logo: '../assets/images/logo.png',
    sidebar: [
      {
        text: '介绍',
        collapsible: true,
        items: [
          {
            text: '核心延伸',
            link: '/',
          },
          {
            text: '屏幕投放',
            link: '/screen-share',
          },
          {
            text: '文件发送',
            link: '/send-file/index',
            items: [
              {
                text: '基础交互',
                link: '/send-file/dataRelay',
              },
              {
                text: '高级交互',
                link: '/send-file/dataRelayPro',
              }
            ]
          },
        ],
      },
    ],
  },
})
