import { siteConfig } from '../config';
import type { Locale } from '../types';
import type { EmailMessage } from './send';

/**
 * Bilingual transactional emails.
 *
 * Written as plain HTML rather than a component library: these are three
 * short messages, and email clients punish cleverness. The palette is the
 * project's own (`CLAUDE.md`) with `fern` on `paper` for the accent, since
 * an email is a light surface and `glow` on light measures 1.7:1.
 *
 * Inline styles only — Gmail strips <style> blocks, and a table-free
 * single-column layout is the one thing every client renders the same.
 */

const PAPER = '#F0EFE3';
const FOREST = '#16281F';
const FERN = '#2A4A3A';
const MOSS = '#3D6552';

function layout(bodyHtml: string, locale: Locale): string {
  const tagline =
    locale === 'ru'
      ? 'История и философия онлайн'
      : 'History and philosophy online';

  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:${FOREST};line-height:1.6;">
    <div style="padding-bottom:24px;border-bottom:1px solid rgba(61,101,82,.2);">
      <div style="font-size:18px;font-weight:600;">Inverted Forest</div>
      <div style="font-size:13px;color:${MOSS};">${tagline}</div>
    </div>
    <div style="padding-top:24px;font-size:16px;">${bodyHtml}</div>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(61,101,82,.2);font-size:12px;color:${MOSS};">
      <a href="${siteConfig.url}/${locale}" style="color:${MOSS};">${siteConfig.url.replace(/^https?:\/\//, '')}</a>
    </div>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:${FERN};color:${PAPER};text-decoration:none;padding:12px 22px;border-radius:8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;">${label}</a></p>`;
}

export interface InviteContext {
  locale: Locale;
  name: string;
  courseTitle: string;
  scheduleLine: string;
  inviteLink: string;
  expiresInDays: number;
}

/**
 * The one email that matters.
 *
 * It carries a link that stops working after a week, which is why the same
 * link is also shown on the page the payer is returned to — this message
 * is the copy they can find again later, not the only chance they get.
 */
export function inviteEmail(context: InviteContext): EmailMessage {
  const ru = context.locale === 'ru';

  const subject = ru
    ? `Ваше приглашение в группу — ${context.courseTitle}`
    : `Your group invitation — ${context.courseTitle}`;

  const greeting = ru ? `Здравствуйте, ${context.name}!` : `Hello ${context.name},`;

  const intro = ru
    ? `Оплата получена, место в группе за вами. Ниже — персональная ссылка в закрытый Telegram-канал вашей группы. Там будут ссылка на занятия, материалы и все объявления.`
    : `Your payment came through and your place is held. Below is your personal link to your group's private Telegram channel — that is where the class link, the materials and every announcement live.`;

  const warning = ru
    ? `Ссылка одноразовая и действует ${context.expiresInDays} дней. Если не успеете — напишите нам, пришлём новую.`
    : `The link works once and expires in ${context.expiresInDays} days. If it lapses, write to us and we'll send another.`;

  const details = ru
    ? `<p style="margin:0 0 4px;color:${MOSS};font-size:14px;">Курс</p><p style="margin:0 0 16px;font-weight:600;">${context.courseTitle}</p>
       <p style="margin:0 0 4px;color:${MOSS};font-size:14px;">Расписание</p><p style="margin:0;font-weight:600;">${context.scheduleLine}</p>`
    : `<p style="margin:0 0 4px;color:${MOSS};font-size:14px;">Course</p><p style="margin:0 0 16px;font-weight:600;">${context.courseTitle}</p>
       <p style="margin:0 0 4px;color:${MOSS};font-size:14px;">Schedule</p><p style="margin:0;font-weight:600;">${context.scheduleLine}</p>`;

  const html = layout(
    `<p style="margin:0 0 16px;">${greeting}</p>
     <p style="margin:0 0 20px;">${intro}</p>
     <div style="background:rgba(143,176,160,.15);border-radius:10px;padding:16px 18px;margin:0 0 8px;">${details}</div>
     ${button(context.inviteLink, ru ? 'Войти в канал группы' : 'Open the group channel')}
     <p style="margin:0;font-size:14px;color:${MOSS};">${warning}</p>`,
    context.locale
  );

  const text = [
    greeting,
    '',
    intro,
    '',
    `${ru ? 'Курс' : 'Course'}: ${context.courseTitle}`,
    `${ru ? 'Расписание' : 'Schedule'}: ${context.scheduleLine}`,
    '',
    context.inviteLink,
    '',
    warning
  ].join('\n');

  return { to: '', subject, html, text };
}

export interface PastDueContext {
  locale: Locale;
  name: string;
  courseTitle: string;
  graceDays: number;
  payUrl: string | null;
}

export function pastDueEmail(context: PastDueContext): EmailMessage {
  const ru = context.locale === 'ru';

  const subject = ru
    ? `Оплата не прошла — ${context.courseTitle}`
    : `A payment didn't go through — ${context.courseTitle}`;

  const body = ru
    ? `<p style="margin:0 0 16px;">Здравствуйте, ${context.name}!</p>
       <p style="margin:0 0 16px;">Очередное списание за курс «${context.courseTitle}» не прошло — чаще всего дело в сроке действия карты или лимите.</p>
       <p style="margin:0 0 16px;">Доступ к группе сохраняется ещё ${context.graceDays} дня. Если получится обновить оплату за это время, ничего делать больше не нужно.</p>`
    : `<p style="margin:0 0 16px;">Hello ${context.name},</p>
       <p style="margin:0 0 16px;">The latest charge for “${context.courseTitle}” didn't go through — usually an expired card or a limit.</p>
       <p style="margin:0 0 16px;">Your access stays open for another ${context.graceDays} days. Update the payment within that window and there is nothing else to do.</p>`;

  const cta = context.payUrl
    ? button(context.payUrl, ru ? 'Обновить оплату' : 'Update payment')
    : `<p style="margin:0;">${
        ru
          ? 'Напишите нам, и мы пришлём новую ссылку на оплату.'
          : "Write to us and we'll send a fresh payment link."
      }</p>`;

  return {
    to: '',
    subject,
    html: layout(body + cta, context.locale),
    text: body.replace(/<[^>]+>/g, '') + (context.payUrl ?? '')
  };
}
