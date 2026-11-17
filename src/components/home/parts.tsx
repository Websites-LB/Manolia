import type { ReactNode } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { cn } from "@/lib/utils";

/** The opening of a chapter: a flower opens on the vine beside it, and the question, set huge. */
export function ChapterHead({ id, bloom, title, children, className }: { id?: string; bloom: string; title: string; children?: ReactNode; className?: string }) {
  return (
    <header id={id} className={cn("gutter relative z-10 scroll-mt-20 pr-9 md:pl-[8vw]", className)}>
      <span data-vine data-bloom={bloom} className="absolute right-[14px] top-[0.35em] h-px w-px md:left-[3.6vw] md:right-auto" />
      <SplitWords text={title} className="display text-[clamp(56px,9.4vw,172px)] text-paper" />
      {children}
    </header>
  );
}

/** Air between two chapters, where the vine leans a little out of its lane. */
export function Sweep({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-[clamp(140px,24vh,260px)]", className)} aria-hidden>
      <span data-vine className="absolute right-[26px] top-1/2 h-px w-px md:left-[6.5vw] md:right-auto" />
    </div>
  );
}

/** Back to the vine's lane under a chapter: the left edge on a computer, the right edge on a phone. */
export function Lane() {
  return <span data-vine className="absolute bottom-0 right-[14px] h-px w-px md:left-[3.6vw] md:right-auto" aria-hidden />;
}
