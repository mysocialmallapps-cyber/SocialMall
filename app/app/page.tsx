"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const suggestions = [
  "quiet luxury",
  "Marbella beach club outfit",
  "black oversized hoodie",
  "summer outfit under €200",
];

const products = [
  {
    id: 1,
    brand: "The Row",
    name: "Cashmere Blend Wide-Leg Trousers",
    price: "€1,190",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    brand: "Jacquemus",
    name: "Le Chouchou Draped Linen Shirt",
    price: "€520",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    brand: "COS",
    name: "Relaxed Oversized Black Hoodie",
    price: "€135",
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    brand: "Toteme",
    name: "Minimalist Structured Wool Blazer",
    price: "€790",
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 5,
    brand: "Aeyde",
    name: "Leather Slip-On Sandals",
    price: "€280",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 6,
    brand: "Loulou Studio",
    name: "Silk Resort Shirt in Sand",
    price: "€310",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 7,
    brand: "Arket",
    name: "Linen Blend Summer Co-ord Set",
    price: "€180",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 8,
    brand: "Mango",
    name: "Open Knit Beach Club Dress",
    price: "€89.99",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("quiet luxury");
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      setActiveQuery(query);
      setIsLoading(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(searchInput);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    runSearch(suggestion);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
          <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Discover your next look
          </h1>
          <form
            className="w-full rounded-[2rem] border border-zinc-100 bg-white p-2 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.3)]"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Describe what you want… outfits, styles, brands"
              className="h-16 w-full rounded-[1.5rem] border border-zinc-200 bg-white px-6 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300"
            />
          </form>
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm text-zinc-500">
            {isLoading ? (
              "Updating results..."
            ) : (
              <>
                Showing results for:{" "}
                <span className="font-medium text-zinc-800">{activeQuery}</span>
              </>
            )}
          </p>

          <div
            className={`grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity md:grid-cols-4 md:gap-x-6 md:gap-y-10 ${
              isLoading ? "opacity-70" : "opacity-100"
            }`}
          >
            {products.map((product) => (
              <article key={product.id} className="group">
                <div
                  className="aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 bg-cover bg-center transition duration-500 group-hover:scale-[1.01]"
                  style={{ backgroundImage: `url(${product.image})` }}
                  aria-label={product.name}
                  role="img"
                />
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                    {product.brand}
                  </p>
                  <p className="truncate text-sm text-zinc-800">{product.name}</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {product.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
