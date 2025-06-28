import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and merges Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param value The number to round
 * @param decimals Number of decimal places
 * @returns Rounded number
 */
export function round(value: number, decimals: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(decimals)) return 0;
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/**
 * Splits an array into chunks of a given size.
 * @param array The array to chunk
 * @param size The size of each chunk
 * @returns Chunked array
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
    if (!Array.isArray(array) || size <= 0) return [];
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value The number to clamp
 * @param min Minimum bound
 * @param max Maximum bound
 * @returns Clamped number
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}