import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale, LocalizedString } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve a localized string with fallback to Russian (source language). */
export function lt(value: LocalizedString, locale: Locale): string {
  return value[locale] || value.ru || value.en || '';
}

export function formatPrice(
  amount: number,
  currency: string,
  locale: Locale
): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(iso));
}

export function weekdayName(weekday: number, locale: Locale): string {
  // 2021-08-01 is a Sunday; offset from it to get any weekday name.
  const date = new Date(Date.UTC(2021, 7, 1 + weekday));
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(date);
}
