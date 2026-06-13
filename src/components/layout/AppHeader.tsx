"use client";

import Image from "next/image";

export default function AppHeader() {
  return (
    <header className="border-b border-wit-border bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="WIT 3D"
            width={140}
            height={48}
            className="h-10 w-auto object-contain sm:h-12"
            priority
          />
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-wit-muted md:flex">
          <a href="#" className="transition-colors hover:text-wit-navy">
            Home
          </a>
          <a
            href="#generate"
            className="relative text-wit-navy after:absolute after:-bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-wit-gold"
          >
            Generate
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-lg border border-wit-border px-3 py-2 text-sm text-wit-muted sm:flex"
            title="Fitur mockup"
          >
            <span aria-hidden>🕐</span> History
          </button>
          <button
            type="button"
            className="rounded-lg bg-wit-navy px-3 py-2 text-sm font-medium text-white sm:px-4"
            onClick={() =>
              document.getElementById("upload-panel")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}
