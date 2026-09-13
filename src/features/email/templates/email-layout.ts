/**
 * PFM M14 Phase 3.5.2 — Shared Email Layout Wrapper
 * Table-based HTML outer layout container with PFM branding and system font stack.
 */

import { escapeHtml } from './html-escaper'
import type { EmailUserContext, EmailReportPeriod } from '../types/email'

export interface RenderEmailLayoutOptions {
  title: string
  subtitle: string
  user: EmailUserContext
  period: EmailReportPeriod
  badgeText: string
  contentHtml: string
}

/**
 * Wraps section HTML into a full email-safe HTML document.
 */
export const renderEmailLayout = (options: RenderEmailLayoutOptions): string => {
  const { title, subtitle, user, period, badgeText, contentHtml } = options
  const safeName = escapeHtml(user.displayName || 'Valued User')
  const safeRange = escapeHtml(period.formattedRange)
  const safeBadge = escapeHtml(badgeText)
  const safeTitle = escapeHtml(title)
  const safeSubtitle = escapeHtml(subtitle)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #09090b; width: 100%; margin: 0; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container (600px Max Content Width) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #121215; border-radius: 12px; border: 1px solid #272732; overflow: hidden; table-layout: fixed;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1a1a22; padding: 24px 32px; border-bottom: 2px solid #ea580c;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">PFM</span>
                    <span style="font-size: 12px; font-weight: 600; color: #ea580c; background-color: rgba(234, 88, 12, 0.15); padding: 4px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle; display: inline-block;">${safeBadge}</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #f8fafc;">${safeTitle}</h1>
              <p style="margin: 0; font-size: 14px; color: #9ca3af;">${safeSubtitle}</p>
            </td>
          </tr>

          <!-- Personal Greeting & Period Bar -->
          <tr>
            <td style="padding: 24px 32px 16px 32px; background-color: #121215;">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #f8fafc;">Hi ${safeName},</p>
              <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">Here is your financial report for <strong style="color: #f8fafc;">${safeRange}</strong>.</p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #09090b; border-top: 1px solid #272732; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #575765;">This automated email report was generated directly by your Personal Finance Manager (PFM).</p>
              <p style="margin: 0; font-size: 11px; color: #575765;">Zero financial data in this report was transmitted to external third-party analytics or AI processing engines.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
