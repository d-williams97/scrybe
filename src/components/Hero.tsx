import React from "react";

interface HeroProps {
  title: string;
  subtitle?: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="w-full flex flex-col items-center text-center gap-3">
      <h1 className="font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-muted-foreground max-w-[720px] text-sm sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </section>
  );
}
