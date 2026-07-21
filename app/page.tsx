import type { Metadata } from "next";

import LumpMapApp from "@/components/LumpMapApp";

export const metadata: Metadata = {
  title: "LumpMap 3D — Anatomy-first lump education",
  description:
    "Explore common superficial lumps by location, depth, and symptoms with a non-diagnostic 3D anatomy navigator.",
};

export default function Home() {
  return <LumpMapApp />;
}
