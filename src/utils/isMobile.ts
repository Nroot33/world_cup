// src/utils/isMobile.ts
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|android|mobile/.test(userAgent);
}
