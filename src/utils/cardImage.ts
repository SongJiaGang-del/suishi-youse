import type { Term } from '../data/terms'
import { onColor, PAPER } from './color'

/**
 * 把一个节气的主色画成一张可以保存、转发的色卡图片（1080 × 1350，适合竖版分享）。
 * 只写页面上本来就有的字（节气名、色名、色值、色彩意象、站名），这些字都在子集字体里，
 * 万一字体还没载入，浏览器会退回系统字体，不会出现空白。
 */
export async function drawTermCard(term: Term): Promise<Blob> {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  const hex = term.color.hex
  const on = onColor(hex)
  const serif = "'Suishi Song', 'Songti SC', 'STSong', 'SimSun', serif"
  const latin = serif

  // 等字体就绪；没有载入也能画，只是用的是后备字体
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`900 100px 'Suishi Song'`, term.color.name + term.name),
        document.fonts.load(`400 40px 'Suishi Song'`, term.name + term.color.name),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ])
  } catch {
    /* 用后备字体 */
  }

  // 纸底 + 上方大色块
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  const blockH = 1020
  ctx.fillStyle = hex
  ctx.fillRect(0, 0, W, blockH)

  ctx.fillStyle = on
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.font = `400 40px ${serif}`
  ctx.letterSpacing = '8px'
  ctx.fillText(`${term.name} · 主色`, 72, 120)

  ctx.font = `900 300px ${serif}`
  ctx.letterSpacing = '18px'
  ctx.fillText(term.color.name, 72, 620)

  ctx.font = `400 56px ${latin}`
  ctx.letterSpacing = '4px'
  ctx.fillText(hex, 72, blockH - 72)

  // 下方：色彩意象与站名
  ctx.fillStyle = '#2B2A28'
  ctx.font = `400 40px ${serif}`
  ctx.letterSpacing = '6px'
  ctx.fillText(`${term.imagery[0]}，${term.imagery[1]}`, 72, blockH + 120)
  ctx.fillStyle = '#6B6862'
  ctx.font = `400 34px ${serif}`
  ctx.letterSpacing = '12px'
  ctx.fillText('岁时有色', 72, H - 72)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}
