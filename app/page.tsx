"use client";

import { ArenaScene } from "./arena-scene";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <ArenaScene />

      {/* Screen reader only semantic content matching enterthearena.com */}
      <section className="sr-only">
        <h1>The Arena — Action Gaming Universe by SNK</h1>
        <h2>About The Arena</h2>
        <p>
          The Arena is an independent studio creating global franchises inspired by
          the worlds of gaming, anime, and event action. With a world-class
          executive team, robust financing, and deep access to top-tier IP, it is
          uniquely equipped to build a modern fandom ecosystem.
        </p>
        <p>
          The Arena is a space for and by fans. It engages and expands committed
          fanbases through an always-on model of offerings, including premium film
          and television, robust social media communities and content, experiential
          events, and consumer goods. The Arena is committed to artistic ambition
          and excellence across its slate of blockbuster films and event series.
        </p>
        <p>
          Producing and financing projects made alongside renowned filmmakers and
          breakout talents, it aims to blend prestige-level quality with franchise
          scale, doing justice to some of the world's most beloved properties and
          their fans.
        </p>
      </section>
    </main>
  );
}
