/** Every page arrives the same way: it fades up out of the night. Opacity only, so fixed bars stay put. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-[arrive_0.9s_cubic-bezier(.16,1,.3,1)_both]">{children}</div>;
}
