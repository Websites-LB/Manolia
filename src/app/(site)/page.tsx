import { Butterflies } from "@/components/art/butterflies-lazy";
import { Hero } from "@/components/hero/hero";
import { AskStory } from "@/components/home/ask-story";
import { BuildStory } from "@/components/home/build-story";
import { Chooser } from "@/components/home/chooser";
import { HowItWorks, Visit } from "@/components/home/closing";
import { Sweep } from "@/components/home/parts";
import { Ready } from "@/components/home/ready";
import { Vine } from "@/components/home/vine";

/**
 * The home page tells one short story: the bouquet, then the three ways to send flowers (a ready
 * one, your own, or the florist's choice), how it reaches them, and the door of the boutique.
 * A vine grows out of the bouquet and runs through every chapter, opening a flower at each.
 */
export default function Home() {
  return (
    <>
      <Vine>
        <Hero />
        <div className="relative overflow-clip" style={{ background: "linear-gradient(#13241a, #101d15 30%, #0d1711 70%, #0b140f)" }}>
          <div className="pointer-events-none absolute right-[-20%] top-[30%] h-[60vh] w-[70vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.07), transparent)" }} />
          <Chooser />
          <Sweep x="58%" className="h-[clamp(160px,26vh,300px)]" />
          <Ready />
          <Sweep x="72%" />
          <BuildStory />
          <Sweep x="40%" />
          <AskStory />
          <Sweep x="66%" />
          <HowItWorks />
          <Sweep x="50%" />
          <Visit />
        </div>
      </Vine>
      <Butterflies />
    </>
  );
}
