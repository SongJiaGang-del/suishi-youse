import { ref } from 'vue'

const message = ref('')
let timer: number | undefined

/** 提示条的两句话单独导出：开发期的字体扫描（src/dev/fontScan.ts）要把它们渲染出来，才知道要保留哪些字 */
export const copiedText = (value: string) => `已复制 ${value}`
export const copyFailedText = (value: string) => `未能复制，请手动选择 ${value}`

function show(text: string) {
  message.value = text
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (message.value = ''), 1800)
}

export function useCopy() {
  return {
    message,
    notify: show,
    async copy(value: string) {
      try {
        await navigator.clipboard.writeText(value)
        show(copiedText(value))
      } catch {
        show(copyFailedText(value))
      }
    },
  }
}
