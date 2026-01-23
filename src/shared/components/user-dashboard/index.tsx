import { CreditCardIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent } from "@/shared/components/ui/dialog"
import { cn } from "@/shared/lib/utils"

const menu = [
  {
    label: "Account",
    icon: UserIcon,
    href: "/dashboard/account",
  },
  {
    label: "Credit",
    icon: CreditCardIcon,
    href: "/dashboard/credit",
  },
]

interface UserDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UserDashboard = ({ open, onOpenChange }: UserDashboardProps) => {
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0)
  const title = menu[currentMenuIndex].label

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-6xl flex p-0">
        <aside className="w-64 border-r overflow-y-auto space-y-2 p-4">
          {menu.map((item, index) => (
            <div
              key={item.label}
              onClick={() => setCurrentMenuIndex(index)}
              className={cn(
                "flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:bg-muted/50 p-2 rounded-md",
                {
                  "text-primary bg-muted/60": currentMenuIndex === index,
                }
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </div>
          ))}
        </aside>
        <main className="flex-1 p-4">
          <div className="text-lg font-bold">{title}</div>
        </main>
      </DialogContent>
    </Dialog>
  )
}
