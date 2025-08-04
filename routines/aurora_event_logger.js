const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

export class Logger {
  /**
   * @param {keyof typeof LOG_LEVELS} level 
   * @param {Array<(entry: object) => void>} transports 
   */
  constructor(level = 'info', transports = [entry => console.log(JSON.stringify(entry))]) {
    this.level = LOG_LEVELS[level] ?? LOG_LEVELS.info
    this.buffer = []
    this.transports = transports
    this.maxBufferSize = 1000
  }

  /**
   * Core log method
   * @param {keyof typeof LOG_LEVELS} level 
   * @param {string} category 
   * @param {any} details 
   */
  log(level, category, details) {
    const lvl = LOG_LEVELS[level]
    if (lvl === undefined || lvl < this.level) return

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      details
    }

    this.buffer.push(entry)
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift()
    }

    for (const transport of this.transports) {
      try {
        transport(entry)
      } catch (err) {
        // swallow transport errors
      }
    }
  }

  debug(category, details) {
    this.log('debug', category, details)
  }

  info(category, details) {
    this.log('info', category, details)
  }

  warn(category, details) {
    this.log('warn', category, details)
  }

  error(category, details) {
    this.log('error', category, details)
  }

  /**
   * Batch log an array of events.
   * Each event must have `type` and `payload`, optionally `level`.
   */
  batchLog(events) {
    if (!Array.isArray(events)) {
      return this.error('Logger', { msg: 'batchLog expects an array', received: events })
    }
    for (const ev of events) {
      const { type, payload, level = 'info' } = ev
      if (typeof type !== 'string' || payload === undefined) {
        this.warn('Logger', { msg: 'invalid event skipped', event: ev })
        continue
      }
      this.log(level, type, payload)
    }
  }

  /**
   * Clear the in-memory buffer.
   */
  flush() {
    this.buffer.length = 0
  }

  /**
   * Change the logging level at runtime.
   * @param {keyof typeof LOG_LEVELS} newLevel 
   */
  setLevel(newLevel) {
    if (LOG_LEVELS[newLevel] === undefined) {
      return this.warn('Logger', { msg: 'invalid log level', attempted: newLevel })
    }
    this.level = LOG_LEVELS[newLevel]
  }

  /**
   * Register an additional transport function.
   * @param {(entry: object) => void} transport 
   */
  addTransport(transport) {
    if (typeof transport === 'function') {
      this.transports.push(transport)
    }
  }

  /**
   * Remove a transport function.
   * @param {(entry: object) => void} transport 
   */
  removeTransport(transport) {
    this.transports = this.transports.filter(t => t !== transport)
  }
}

// Usage
// import { Logger } from './logger'
// const logger = new Logger('debug')
// logger.info('AppStart', { version: '1.0.0' })
// logger.debug('Auth', { user: 'alice', action: 'login' })
// logger.batchLog([...])
// logger.flush()
