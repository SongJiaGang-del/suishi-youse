import vue from '@vitejs/plugin-vue'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * 分享卡片里的图片和链接必须是绝对网址：微信、X、Telegram 的爬虫不会替页面补全域名。
 * 部署时设置环境变量 VITE_SITE_URL 为站点首页的完整网址（例如 https://example.com/suishi/），
 * 构建时就会补上 og:image、twitter:image、og:url 和 canonical。
 * 没有设置时：图片退回站内路径（本地开发够用，但分享出去抓不到），并且不写 og:url 和 canonical。
 */
function shareMeta(siteUrl: string): Plugin {
  const root = siteUrl ? siteUrl.replace(/\/*$/, '/') : ''
  let base = '/'
  return {
    name: 'share-meta',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml() {
      const image = root ? `${root}og-cover.png` : `${base}og-cover.png`
      const meta = (attrs: Record<string, string>) => ({ tag: 'meta', attrs, injectTo: 'head' as const })
      return [
        meta({ property: 'og:image', content: image }),
        meta({ name: 'twitter:image', content: image }),
        ...(root
          ? [
              meta({ property: 'og:url', content: root }),
              { tag: 'link', attrs: { rel: 'canonical', href: root }, injectTo: 'head' as const },
            ]
          : []),
      ]
    },
  }
}

/**
 * 每个页面都要用的字体分包（名字里带 -core-，见 scripts/build_font.py）提前预加载。
 * 否则要等入口脚本跑完、懒加载的页面组件也到了、文字排出来，浏览器才知道要这些字体，每个页面都白等一轮请求。
 * 只预加载“每个页面都会用到”的：预加载了却没用上，浏览器会在控制台警告，还浪费流量。
 * 而且只预加载 900 的核心（首页大标题用它，26 KB）：400 的核心有 53 KB，一起预加载会和大标题抢带宽，
 * 真降速下首屏反而更慢；正文晚一点换上自制字体没有关系。
 */
function preloadCoreFonts(): Plugin {
  let base = '/'
  return {
    name: 'preload-core-fonts',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml(_html, ctx) {
      const files = Object.keys(ctx.bundle ?? {})
        .filter((f) => /-900-core-[\w-]+\.woff2$/.test(f))
        .sort()
      return files.map((f) => ({
        tag: 'link',
        // 字体请求一律是跨域模式，预加载也要带 crossorigin，否则浏览器会当成两个请求各下一遍
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `${base}${f}`, crossorigin: '' },
        injectTo: 'head' as const,
      }))
    },
  }
}

/**
 * 只在开发服务器里：接收 src/dev/fontScan.ts 扫出来的“各字体用了哪些字”，写成 scripts/font-chars.json，
 * 供 scripts/build_font.py 分包用。生产构建不带这个接口。
 */
function fontChars(): Plugin {
  return {
    name: 'font-chars',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__font-chars', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            const file = resolve(server.config.root, 'scripts/font-chars.json')
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
            res.end('ok')
          } catch (e) {
            res.statusCode = 400
            res.end(String(e))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [vue(), shareMeta((env.VITE_SITE_URL ?? '').trim()), preloadCoreFonts(), fontChars()],
    build: {
      // 裁出来的字体分包有的只有一两 KB，默认会被内联成 base64 塞进 CSS，浏览器就没法“用到才下载”了
      assetsInlineLimit: (file: string) => (file.endsWith('.woff2') ? false : undefined),
    },
  }
})
