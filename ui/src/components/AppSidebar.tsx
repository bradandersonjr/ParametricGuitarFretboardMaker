import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import type { PageId } from "@/types"
import { SlidersHorizontal, FileBarChart, Scroll, HelpCircle, Users, Heart, Info, LayoutTemplate, Bug, ExternalLink, Activity, Share2, CheckCircle } from "lucide-react"
import { openUrl } from "@/lib/fusion-bridge"
import IconSvg from "@/assets/icon.svg"

const NAV_ITEMS: { id: PageId; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "parameters", label: "Parameters", icon: SlidersHorizontal },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "share", label: "Share", icon: Share2 },
  { id: "community", label: "Community", icon: Users },
  { id: "support", label: "Support", icon: Heart },
  { id: "about", label: "About", icon: Info },
  { id: "changelog", label: "Changelog", icon: Scroll },

]

export function AppSidebar({
  activePage,
  onPageChange,
  connected,
  hasFingerprint,
}: {
  activePage: PageId
  onPageChange: (page: PageId) => void
  connected: boolean
  hasFingerprint: boolean
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  const handlePageChange = (page: PageId) => {
    onPageChange(page)
    // Close sidebar on mobile when a page is selected
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                <img src={IconSvg} alt="App" className="size-6 brightness-0 invert" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-md font-bold font-heading">Fretboard</span>
                <span className="truncate text-xs text-muted-foreground font-medium">Maker</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={activePage === item.id}
                    onClick={() => handlePageChange(item.id)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={connected ? "Connected" : "Connecting..."}
              className="cursor-default"
              tabIndex={-1}
            >
              <Activity className={`w-4 h-4 shrink-0 pointer-events-none ${connected ? "text-green-500" : "text-red-500"}`} />
              <span className="text-xs text-muted-foreground pointer-events-none">
                {connected ? "Connected" : "Connecting..."}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={hasFingerprint ? "Fretboard detected" : "No fretboard detected"}
              className="cursor-default"
              tabIndex={-1}
            >
              <CheckCircle className={`w-4 h-4 shrink-0 pointer-events-none ${hasFingerprint ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground pointer-events-none">
                {hasFingerprint ? "Fretboard" : "No Fretboard"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator />
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="View Issues (opens in browser)"
              onClick={() => openUrl("https://github.com/bradandersonjr/ParametricGuitarFretboardMaker/issues")}
            >
              <Bug />
              <span className="flex items-center gap-1">
                Issues
                <ExternalLink className="w-3 h-3 opacity-60" />
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help & Support"
              isActive={activePage === "help"}
              onClick={() => handlePageChange("help")}
            >
              <HelpCircle />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
