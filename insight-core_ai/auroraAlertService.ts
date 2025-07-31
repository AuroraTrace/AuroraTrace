// auroraAlertService.ts

import { AuroraSignal } from './auroraPatternEngine'
import nodemailer, { Transporter } from 'nodemailer'
import fetch from 'node-fetch'
import { URL } from 'url'
import { createLogger, format, transports } from 'winston'

interface AlertConfig {
  email?: {
    from: string
    to: string[]
    smtpHost: string
    smtpPort: number
    user: string
    pass: string
  }
  webhookUrl?: string
  retryCount?: number
  timeoutMs?: number
}

interface AlertMessage {
  subject: string
  body: string
}

export class AuroraAlertService {
  private config: AlertConfig
  private transporter?: Transporter
  private logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [new transports.Console()],
  })

  constructor(config: AlertConfig) {
    this.config = { retryCount: 2, timeoutMs: 5000, ...config }
    if (config.email) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpPort === 465,
        auth: { user: config.email.user, pass: config.email.pass },
        pool: true,
        connectionTimeout: this.config.timeoutMs,
      })
    }
  }

  private formatMessage(signal: AuroraSignal): AlertMessage {
    const time = new Date(signal.timestamp).toISOString()
    const strengthPct = Math.round(signal.signalStrength * 100)
    return {
      subject: `⚡ AuroraTrace Alert: ${signal.description}`,
      body: [
        `Time: ${time}`,
        `Signal: ${signal.description}`,
        `Strength: ${strengthPct}%`,
      ].join('\n'),
    }
  }

  private async sendEmail(message: AlertMessage): Promise<void> {
    if (!this.transporter || !this.config.email) return
    const mailOpts = {
      from: this.config.email.from,
      to: this.config.email.to.join(','),
      subject: message.subject,
      text: message.body,
    }
    for (let attempt = 1; attempt <= (this.config.retryCount || 1); attempt++) {
      try {
        await this.transporter.sendMail(mailOpts)
        this.logger.info(`Email sent: ${message.subject}`)
        return
      } catch (err) {
        this.logger.warn(`Email attempt ${attempt} failed: ${err}`)
        if (attempt === this.config.retryCount) throw err
      }
    }
  }

  private async sendWebhook(signal: AuroraSignal): Promise<void> {
    if (!this.config.webhookUrl) return
    const payload = {
      timestamp: signal.timestamp,
      description: signal.description,
      strength: signal.signalStrength,
    }
    const url = new URL(this.config.webhookUrl)
    for (let attempt = 1; attempt <= (this.config.retryCount || 1); attempt++) {
      try {
        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeout: this.config.timeoutMs,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        this.logger.info(`Webhook sent: ${signal.description}`)
        return
      } catch (err) {
        this.logger.warn(`Webhook attempt ${attempt} failed: ${err}`)
        if (attempt === this.config.retryCount) throw err
      }
    }
  }

  async dispatchAlerts(signals: AuroraSignal[]): Promise<void> {
    await Promise.all(signals.map(async signal => {
      const msg = this.formatMessage(signal)
      try {
        await Promise.all([this.sendEmail(msg), this.sendWebhook(signal)])
      } catch (err) {
        this.logger.error(`Alert dispatch failed for ${signal.description}: ${err}`)
      }
    }))
  }
}
