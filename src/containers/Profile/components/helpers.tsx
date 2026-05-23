export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "#1c8ee5",
  "#6a6a6a",
  "#52c41a",
  "#fa8c16",
  "#13c2c2",
  "#eb2f96",
  "#722ed1",
  "#cf1322",
];

export function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = ch.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
