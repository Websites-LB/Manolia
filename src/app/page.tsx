import { Hero } from "@/components/hero/hero";
import { Manifesto } from "@/components/home/manifesto";
import { Ordering } from "@/components/home/ordering";
import { Signatures } from "@/components/home/signatures";
import { Stems } from "@/components/home/stems";
import { Visit } from "@/components/home/visit";
import { Weddings } from "@/components/home/weddings";

/** The home page reads as one argument in chapters: who we are, what we make, how to get it, where to find us. */
export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Signatures />
      <Weddings />
      <Stems />
      <Ordering />
      <Visit />
    </>
  );
}
