// Shared state for the Add / Edit expense sheet, so any page can open it.
import { reactive } from 'vue'

export const editor = reactive({ open: false, expense: null })

export function openEditor(expense = null) {
  editor.expense = expense
  editor.open = true
}

export function closeEditor() {
  editor.open = false
}
