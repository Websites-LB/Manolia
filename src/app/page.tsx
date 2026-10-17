import { Services, Signatures, StemsBand, Visit } from "@/components/home/sections";
import { HeroBouquet } from "@/components/hero/hero-bouquet";

export default function Home() {
  return (
    <>
      <HeroBouquet />
      <Services />
      <Signatures />
      <StemsBand />
      <Visit />
    </>
  );
}
