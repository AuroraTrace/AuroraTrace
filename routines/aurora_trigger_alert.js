const DEFAULT_HANDLERS = {
  high:     msg => console.error('🚨', msg),
  medium:   msg => console.warn('⚠️', msg),
  low:      msg => console.info('✅', msg)
}

class AlertManager {
  constructor(handlers = {}) {
    this.handlers = { ...DEFAULT_HANDLERS, ...handlers }
  }

  trigger(level, message) {
    const handler = this.handlers[level] || this.handlers.low
    try {
      handler(message)
    } catch (err) {
      console.error('AlertManager error:', err)
    }
  }

  addHandler(level, fn) {
    if (typeof fn === 'function') {
      this.handlers[level] = fn
    }
  }

  removeHandler(level) {
    delete this.handlers[level]
  }

  setDefaultHandler(fn) {
    if (typeof fn === 'function') {
      this.handlers.low = fn
    }
  }
}

export default new AlertManager()
import alertManager from './AlertManager.js'

// default behavior
alertManager.trigger('high',   'Critical breach detected')
alertManager.trigger('medium', 'Unusual activity')
alertManager.trigger('low',    'All systems normal')

// add a custom “critical” channel
alertManager.addHandler('critical', msg => {
  // e.g. send to remote monitoring API
  fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'critical', message: msg, time: Date.now() })
  })
})

alertManager.trigger('critical', 'Database unreachable')

// remove the medium warning
alertManager.removeHandler('medium')
alertManager.trigger('medium', 'This will now log as low')
