/**
 * Author: Codex
 * Date: 2026-10-07
 * PURPOSE: Support Human ARC at a configurable hosting prefix within ARC Explainer.
 * SRP/DRY check: Pass — shared appPath helper keeps application and asset URLs consistent.
 */
/** Prefix raw browser URLs; Wouter links receive their prefix from Router instead. */
export function appPath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
