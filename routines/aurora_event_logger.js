const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

class Logger {
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] ?? LOG_LEVELS.info;
    this.buffer = [];
  }

  log(level, category, details) {
    const lvl = LOG_LEVELS[level];
    if (lvl === undefined || lvl < this.level) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      details
    };

    this.buffer.push(entry);
    this._output(entry);
  }

  debug(category, details) {
    this.log('debug', category, details);
  }

  info(category, details) {
    this.log('info', category, details);
  }

  warn(category, details) {
    this.log('warn', category, details);
  }

  error(category, details) {
    this.log('error', category, details);
  }

  batchLog(events) {
    if (!Array.isArray(events)) {
      this.error('Logger', { msg: 'batchLog expects an array', received: events });
      return;
    }

    for (const ev of events) {
      if (typeof ev.type !== 'string' || ev.payload === undefined) {
        this.warn('Logger', { msg: 'invalid event skipped', event: ev });
        continue;
      }
      this.log(ev.level || 'info', ev.type, ev.payload);
    }
  }

  flush() {
    this.buffer.length = 0;
  }

  _output(entry) {
    try {
      // emit structured log as JSON
      console.log(JSON.stringify(entry));
    } catch (err) {
      // fallback to simple output on failure
      console.error(`[Logger][error] ${new Date().toISOString()}:`, err);
    }
  }

  setLevel(newLevel) {
    if (LOG_LEVELS[newLevel] === undefined) {
      this.warn('Logger', { msg: 'invalid log level', attempted: newLevel });
      return;
    }
    this.level = LOG_LEVELS[newLevel];
  }
}

// Usage example:
const logger = new Logger('debug');

logger.info('AppStart', { version: '1.0.0' });
logger.debug('Auth', { user: 'alice', action: 'login' });

const events = [
  { type: 'OrderCreated', payload: { id: 123, amount: 49.99 } },
  { type: 'OrderFailed', level: 'error', payload: { id: 124, reason: 'insufficient_funds' } },
  { bad: 'event' }
];

logger.batchLog(events);

// if you want to drop stored entries:
logger.flush();
