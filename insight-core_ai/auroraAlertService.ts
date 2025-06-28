// auroraAlertService.ts

import { AuroraSignal } from './auroraPatternEngine'
import nodemailer from 'nodemailer'

/**
 * Configuration for alert delivery channels
 */
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
}

/**
 * Represents a formatted alert message
 */
interface AlertMessage {
  subject: string
  body: string
}

/**
 * Service that dispatches alerts when Aurora signals occur
 */
export class AuroraAlertService {
  private config: AlertConfig

  constructor(config: AlertConfig) {
    this.config = config
  }

  /**
   * Formats an AuroraSignal into an email or webhook payload
   */
  private formatMessage(signal: AuroraSignal): AlertMessage {
    const time = new Date(signal.timestamp).toISOString()
    const strengthPct = Math.round(signal.signalStrength * 100)
    const subject = `AuroraTrace Alert: ${signal.description}`
    const body = `
      Time: ${time}
      Signal: ${signal.description}
      Strength: ${strengthPct}%
    `
    return { subject, body }
  }

  /**
   * Sends an email alert via SMTP
   */
  private async sendEmail(message: AlertMessage) {
    if (!this.config.email) return
    const transporter = nodemailer.createTransport({
      host: this.config.email.smtpHost,
      port: this.config.email.smtpPort,
      secure: this.config.email.smtpPort === 465,
      auth: {
        user: this.config.email.user,
        pass: this.config.email.pass
      }
    })
    await transporter.sendMail({
      from: this.config.email.from,
      to: this.config.email.to,
      subject: message.subject,
      text: message.body.trim()
    })
  }

  /**
   * Sends a JSON payload to a webhook URL
   */
  private async sendWebhook(signal: AuroraSignal) {
    if (!this.config.webhookUrl) return
    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: signal.timestamp,
        description: signal.description,
        strength: signal.signalStrength
      })
    })
  }

  /**
   * Dispatches alert(s) for one or more signals
   */
  async dispatchAlerts(signals: AuroraSignal[]) {
    for (const signal of signals) {
      const message = this.formatMessage(signal)
      await Promise.all([
        this.sendEmail(message),
        this.sendWebhook(signal)
      ])
    }
  }
}
