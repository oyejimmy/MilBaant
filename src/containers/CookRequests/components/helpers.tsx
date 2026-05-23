import dayjs from "dayjs";

export function formatRelative(ts: string) {
  const d = dayjs(ts);
  const diff = dayjs().diff(d, "minute");
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return d.format("DD MMM, h:mm A");
}
