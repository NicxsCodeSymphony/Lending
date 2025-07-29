import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toZonedTime, format } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a date to Manila timezone (Asia/Manila)
 * @param date - The date to convert (defaults to current date)
 * @returns ISO string in Manila timezone
 */
export function toManilaTime(date: Date = new Date()): string {
  const manilaTimeZone = 'Asia/Manila'
  const manilaTime = toZonedTime(date, manilaTimeZone)
  return manilaTime.toISOString()
}

/**
 * Format a date in Manila timezone
 * @param date - The date to format
 * @param formatString - The format string (defaults to ISO string)
 * @returns Formatted date string
 */
export function formatManilaTime(date: Date, formatString: string = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"): string {
  const manilaTimeZone = 'Asia/Manila'
  const manilaTime = toZonedTime(date, manilaTimeZone)
  return format(manilaTime, formatString, { timeZone: manilaTimeZone })
}
