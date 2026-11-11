import { Butterflies } from "@/components/art/butterflies-lazy";
import { Garden } from "@/components/garden/garden";
import { Hero } from "@/components/hero/hero";

/**
 * One illustrated plate from top to bottom: the bouquet, then its roots running down the page,
 * with every flower, the weddings, the ordering and the door of the boutique growing off them.
 */
export default function Home() {
  return (
    <>
      <Garden>
        <Hero />
      </Garden>
      <Butterflies />
    </>
  );
}
