import { TopBar } from "@/components/shared/TopBar"
import { SettingsContent } from "@/components/settings/SettingsContent"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <SettingsContent />
      </div>
    </div>
  )
}
