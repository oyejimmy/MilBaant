import { useMemo } from "react";
import { HomeOutlined } from "@ant-design/icons";
import { NAV_GROUPS } from "./constants";
import { APP_NAME } from "@/lib/constants";

export function getActivePath(pathname: string): string {
  return pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
}

export function getBreadcrumbs(activePath: string, pathname: string) {
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const item = all.find((i) => i.key === activePath);

  if (pathname.startsWith("/profile")) {
    return [
      { title: APP_NAME, path: "/", icon: <HomeOutlined /> },
      { title: "My Profile", path: "/profile" },
    ];
  }

  if (!item || activePath === "/") {
    return [
      { title: APP_NAME, path: "/", icon: <HomeOutlined /> },
      { title: "Dashboard", path: "/" },
    ];
  }

  const group = NAV_GROUPS.find((g) =>
    g.items.some((i) => i.key === activePath),
  );
  const crumbs: { title: string; path?: string; icon?: React.ReactNode }[] = [
    { title: APP_NAME, path: "/", icon: <HomeOutlined /> },
  ];
  if (group?.label) crumbs.push({ title: group.label });
  crumbs.push({ title: item.label, path: activePath });
  return crumbs;
}

export function useFilteredNavItems(isAdmin: boolean, isCook: boolean) {
  return useMemo(() => {
    const items: typeof NAV_GROUPS = [];
    for (const group of NAV_GROUPS) {
      const visibleItems = group.items.filter(
        (i) => (!i.adminOnly || isAdmin) && (!i.cookHidden || !isCook),
      );
      if (visibleItems.length > 0) {
        items.push({ ...group, items: visibleItems });
      }
    }
    return items;
  }, [isAdmin, isCook]);
}

export function useMobileNavItems(isAdmin: boolean, isCook: boolean) {
  const filteredGroups = useFilteredNavItems(isAdmin, isCook);

  return useMemo(() => {
    const allItems = filteredGroups.flatMap((g) => g.items);
    const priority = [
      "/",
      "/expenses",
      "/cook-requests",
      "/contributions",
      "/daily-menu",
    ];

    return allItems
      .filter((i) => priority.includes(i.key))
      .sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key));
  }, [filteredGroups]);
}
