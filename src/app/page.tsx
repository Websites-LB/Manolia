import { Services, Signatures, StemsBand, Visit } from "@/components/home/sections";
import { HeroBloom } from "@/components/hero/hero-bloom";

export default function Home() {
  return (
    <>
      <HeroBloom />
      <Services />
      <Signatures />
      <StemsBand />
      <Visit />
    </>
  );
}
