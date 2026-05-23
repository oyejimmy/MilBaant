import { MenuOutlined } from "@ant-design/icons";
import { useMobileNavItems } from "./hooks";
import { BottomNav, BottomNavItem, ActiveDot, BottomNavLabel, BadgeDot } from "./styles";

interface MobileBottomNavProps {
  activePath: string;
  onNavigate: (path: string) => void;
  onOpenDrawer: () => void;
  pendingRequestCount: number;
  announcementCount: number;
  isAdmin: boolean;
  isCook: boolean;
}

export function MobileBottomNav({
  activePath,
  onNavigate,
  onOpenDrawer,
  pendingRequestCount,
  announcementCount,
  isAdmin,
  isCook,
}: MobileBottomNavProps) {
  const mobileItems = useMobileNavItems(isAdmin, isCook);

  return (
    <BottomNav role="navigation" aria-label="Main navigation">
      {mobileItems.map((item) => {
        const isActive = activePath === item.key;
        const showBadge =
          (item.key === "/cook-requests" && pendingRequestCount > 0) ||
          (item.key === "/announcements" && announcementCount > 0);
        const badgeCount =
          item.key === "/cook-requests"
            ? pendingRequestCount
            : item.key === "/announcements"
            ? announcementCount
            : 0;
        const badgeColor = item.key === "/cook-requests" ? "#ff4d4f" : undefined;

        return (
          <BottomNavItem
            key={item.key}
            $active={isActive}
            onClick={() => onNavigate(item.key)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && <ActiveDot />}
            <span style={{ position: "relative", display: "inline-flex" }}>
              {item.icon}
              {showBadge && <BadgeDot $color={badgeColor}>{badgeCount}</BadgeDot>}
            </span>
            <BottomNavLabel>{item.label}</BottomNavLabel>
          </BottomNavItem>
        );
      })}
      <BottomNavItem $active={false} onClick={onOpenDrawer} aria-label="More navigation">
        <MenuOutlined />
        <BottomNavLabel>More</BottomNavLabel>
      </BottomNavItem>
    </BottomNav>
  );
}