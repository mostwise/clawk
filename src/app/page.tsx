"use client"

// biome-ignore assist/source/organizeImports: just shut up dude
import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Settings } from "lucide-react"
import { toZonedTime, format as formatTz } from "date-fns-tz"
import { useTheme } from "next-themes"

const allTimezones = Intl.supportedValuesOf("timeZone")

const tzGroups = new Map()

allTimezones.forEach((tz) => {
  const d = new Date()
  const offsetString = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value || ""
  
  const abbr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value || ""
  
  const formattedOffset = offsetString.replace("GMT", "UTC") || "UTC"
  
  let numericOffset = 0
  if (formattedOffset !== "UTC") {
    const match = /UTC([+-])(\d+)(?::(\d+))?/.exec(formattedOffset)
    if (match) {
      const sign = match[1] === "-" ? -1 : 1
      const hours = parseInt(match[2] || "0", 10)
      const minutes = parseInt(match[3] || "0", 10)
      numericOffset = sign * (hours * 60 + minutes)
    }
  }

  const isDedicated = /^[A-Za-z]+$/.test(abbr)

  if (isDedicated) {
    const key = `${abbr}_${formattedOffset}`
    if (!tzGroups.has(key)) {
      tzGroups.set(key, {
        value: tz,
        label: `${abbr} (${formattedOffset})`,
        shortLabel: `${abbr} (${formattedOffset})`,
        numericOffset,
      })
    }
  } else {
    tzGroups.set(tz, {
      value: tz,
      label: `${tz} (${formattedOffset})`,
      shortLabel: `${tz} (${formattedOffset})`,
      numericOffset,
    })
  }
})

const tzMap = Array.from(tzGroups.values()).sort((a, b) => a.numericOffset - b.numericOffset)

export default function Home() {
  const [time, setTime] = useState<Date | null>(null)
  const [selectedTz, setSelectedTz] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [militaryTime, setMilitaryTime] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setTime(new Date())
    setSelectedTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time || !selectedTz) {
    return <div className="min-h-screen flex items-center justify-center bg-background" />
  }

  const zonedTime = toZonedTime(time, selectedTz)
  const dateFormat = militaryTime ? "HH:mm:ss" : "hh:mm:ss aa"
  const timeString = formatTz(zonedTime, dateFormat, { timeZone: selectedTz })
  

  let activeTzInfo = tzMap.find((t) => t.value === selectedTz)
  if (!activeTzInfo && selectedTz) {
    const d = new Date()
    const offsetString = new Intl.DateTimeFormat("en-US", { timeZone: selectedTz, timeZoneName: "shortOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value || ""
    const abbr = new Intl.DateTimeFormat("en-US", { timeZone: selectedTz, timeZoneName: "short" }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value || ""
    const formattedOffset = offsetString.replace("GMT", "UTC") || "UTC"
    const isDedicated = /^[A-Za-z]+$/.test(abbr)
    activeTzInfo = isDedicated ? tzMap.find(t => t.label === `${abbr} (${formattedOffset})`) : { value: selectedTz, label: `${selectedTz} (${formattedOffset})`, shortLabel: `${selectedTz} (${formattedOffset})` }
  }

  const filteredTzMap = tzMap.filter((tz) => tz.label.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background font-mono text-foreground relative">
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50">
            <Settings className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 font-mono" align="end">
          <div className="flex flex-col space-y-4">
            <h4 className="font-medium leading-none">Settings</h4>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="military-time" className="flex flex-col space-y-1 items-start">
                <span>military time</span>
                <span className="font-normal text-xs text-muted-foreground">
                  use either 24-hour or am/pm format
                </span>
              </Label>
              <Switch
                id="military-time"
                checked={militaryTime}
                onCheckedChange={setMilitaryTime}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="dark-mode" className="flex flex-col space-y-1 items-start">
                <span>dark mode</span>
                <span className="font-normal text-xs text-muted-foreground">
                  toggle dark/light mode
                </span>
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="text-6xl md:text-8xl font-bold tracking-tighter mb-6">
        {timeString}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 text-xl md:text-2xl text-muted-foreground mt-2">
        <span>tz: {activeTzInfo?.shortLabel || selectedTz}</span>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <span
              className="cursor-pointer text-primary hover:text-primary/80 transition-colors text-sm md:text-base inline-flex flex-row items-center border border-border px-3 py-1.5 rounded shadow-sm ml-0 sm:ml-2"
              role="button"
              tabIndex={0}
            >
              (change)
              <ChevronsUpDown className="ml-1 h-4 w-4" />
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-87.5 p-0 font-mono" align="center">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Search timezone..." className="font-mono" value={searchQuery} onValueChange={setSearchQuery} />
              <CommandList>
                <CommandEmpty className="py-6 text-center text-sm">no timezone found.</CommandEmpty>
                <CommandGroup>
                  {filteredTzMap.map((tz) => (
                    <CommandItem
                      key={tz.value}
                      value={tz.label}
                      onSelect={() => {
                        setSelectedTz(tz.value)
                        setOpen(false)
                      }}
                      className="font-mono text-xs sm:text-sm"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selectedTz === tz.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tz.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
