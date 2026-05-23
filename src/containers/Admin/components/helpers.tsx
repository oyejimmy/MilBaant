import { AVATAR_COLORS } from "../constants";

export function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = ch.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
