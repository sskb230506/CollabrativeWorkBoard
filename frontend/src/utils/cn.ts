import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─────────────────────────────────────────────────────────────────────────────
// cn — Class Name Utility
//
// Combines clsx (conditional class logic) with tailwind-merge (deduplication
// of conflicting Tailwind classes such as `px-2 px-4` → `px-4`).
// This is the standard pattern used in shadcn/ui and most modern Tailwind apps.
// ─────────────────────────────────────────────────────────────────────────────

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
