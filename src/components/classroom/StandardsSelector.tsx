import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useStandards } from "@/hooks/useStandards";
import { cn } from "@/lib/utils";

interface StandardsSelectorProps {
  grade?: number;
  subject?: string;
  selectedStandards: string[];
  onStandardsChange: (standards: string[]) => void;
}

export const StandardsSelector = ({
  grade,
  subject,
  selectedStandards,
  onStandardsChange,
}: StandardsSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: standards, isLoading } = useStandards(grade, subject);

  const toggleStandard = (standardId: string) => {
    if (selectedStandards.includes(standardId)) {
      onStandardsChange(selectedStandards.filter((id) => id !== standardId));
    } else {
      onStandardsChange([...selectedStandards, standardId]);
    }
  };

  const selectedStandardsData = standards?.filter((s) =>
    selectedStandards.includes(s.id)
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Common Core Standards (Optional)</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedStandards.length > 0
              ? `${selectedStandards.length} standard${selectedStandards.length > 1 ? "s" : ""} selected`
              : "Select standards..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0">
          <Command>
            <CommandInput placeholder="Search standards..." />
            <CommandEmpty>No standards found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading...</div>
              ) : (
                standards?.map((standard) => (
                  <CommandItem
                    key={standard.id}
                    value={standard.code}
                    onSelect={() => toggleStandard(standard.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedStandards.includes(standard.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{standard.code}</div>
                      <div className="text-xs text-muted-foreground">
                        {standard.description}
                      </div>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedStandardsData && selectedStandardsData.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedStandardsData.map((standard) => (
            <Badge
              key={standard.id}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleStandard(standard.id)}
            >
              {standard.code}
              <span className="ml-1">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
