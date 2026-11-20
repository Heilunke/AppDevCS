// Small wrapper around localStorage. Every key gets the "pesowise_" prefix.
const PREFIX = 'pesowise_'

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    // Usually means storage is full (too many receipt photos)
    return false
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key)
}
