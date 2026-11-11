export default function ShopHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-8 pt-12">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 dark:text-blue-400">
            THE COLLECTION
          </p>
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
          Find your next
          <span className="text-gray-400 dark:text-zinc-500"> favourite.</span>
        </h1>

        <p className="max-w-lg text-sm leading-6 text-gray-500 sm:text-base dark:text-gray-400">
          Explore products chosen to make everyday living better. Discover
          something you'll love.
        </p>

        <div className="mt-3 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-zinc-800">
          <p className="text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400">
            DISCOVER OUR PRODUCTS
          </p>
          <span className="text-gray-500 dark:text-gray-400">↓</span>
        </div>
      </div>
    </section>
  );
}
