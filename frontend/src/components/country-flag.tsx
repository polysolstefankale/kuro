import type { FC, SVGProps } from "react";
import AT from "country-flag-icons/react/3x2/AT";
import CH from "country-flag-icons/react/3x2/CH";
import DE from "country-flag-icons/react/3x2/DE";
import LI from "country-flag-icons/react/3x2/LI";
import { countryCode } from "@/lib/plz";

const FLAGS: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  at: AT,
  ch: CH,
  de: DE,
  li: LI,
};

interface CountryFlagProps {
  land: string;
  className?: string;
  title?: string;
}

export function CountryFlag({
  land,
  className = "h-4 w-6 shrink-0 rounded-sm border border-slate-200/80 shadow-sm",
  title,
}: CountryFlagProps) {
  const code = countryCode(land)?.toLowerCase();
  const Flag = code ? FLAGS[code] : null;
  const label = title ?? land;

  if (!Flag) {
    return (
      <span
        className="inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-slate-100 text-[9px] font-medium uppercase text-slate-500"
        title={label}
        aria-label={label}
      >
        {land.slice(0, 2) || "?"}
      </span>
    );
  }

  return <Flag className={className} title={label} aria-label={label} />;
}
