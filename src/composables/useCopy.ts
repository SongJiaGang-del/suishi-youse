import { ref } from 'vue'

const message = ref('')
let timer: number | undefined

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
        show(`已复制 ${value}`)
      } catch {
        show(`未能复制，请手动选择 ${value}`)
      }
    },
  }
}
