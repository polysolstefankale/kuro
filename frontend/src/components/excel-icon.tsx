import { cn } from "@/lib/utils";

interface ExcelIconProps {
  className?: string;
}

export function ExcelIcon({ className }: ExcelIconProps) {
  return (
    <img
      src="/icons/microsoft-excel-2021.svg"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("block shrink-0 object-contain", className)}
    />
  );
}
