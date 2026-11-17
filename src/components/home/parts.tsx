import type { ReactNode } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { cn } from "@/lib/utils";

/**
 * The opening of a chapter: a flower opens on the vine beside it, a short line in blush says what
 * this part is for, then the question it answers, set huge.
 */
export function ChapterHead({ id, bloom, kicker, title, children, className }: { id?: string; bloom: string; kicker: string; title: string; children?: ReactNode; className?: string }) {
  return (
    <header id={id} className={cn("gutter relative z-10 scroll-mt-20 pr-9 md:pl-[8vw]", className)}>
      <span data-vine data-bloom={bloom} className="absolute right-[14px] top-[6px] h-px w-px md:left-[3.6vw] md:right-auto md:top-[8px]" />
      <p className="label text-blush">{kicker}</p>
      <SplitWords text={title} className="display mt-5 text-[clamp(54px,8.6vw,156px)] text-paper" />
      {children}
    </header>
  );
}

/** Empty air between two chapters, where the vine swings across the page. */
export function Sweep({ x, className }: { x: string; className?: string }) {
  return (
    <div className={cn("relative h-[clamp(140px,24vh,260px)]", className)} aria-hidden>
      <span data-vine className="absolute top-1/2 h-px w-px" style={{ left: x }} />
    </div>
  );
}

/** Back to the vine's lane under a chapter: the left edge on a computer, the right edge on a phone. */
export function Lane() {
  return <span data-vine className="absolute bottom-0 right-[14px] h-px w-px md:left-[3.6vw] md:right-auto" aria-hidden />;
}
