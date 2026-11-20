"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** `on-dark` = white logo for dark backgrounds; `on-light` = black logo for light backgrounds */
export type LogoSurface = "on-dark" | "on-light";

const LOGO_SRC: Record<LogoSurface, string> = {
  "on-dark": "/oneroot_logo_white.png",
  "on-light": "/oneroot_logo_black.png",
};

interface BrandLogoProps {
  surface: LogoSurface;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function BrandLogo({
  surface,
  className,
  imageClassName,
  priority,
}: BrandLogoProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <Image
        src={LOGO_SRC[surface]}
        alt="OneRoot"
        fill
        className={cn("object-contain object-left", imageClassName)}
        sizes="(max-width: 768px) 120px, 160px"
        priority={priority}
      />
    </div>
  );
}
