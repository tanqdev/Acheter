import { pool } from "../server/src/db/pool";

const products = [
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with adjustable DPI",
    price_cents: 1999,
    stock: 25,
  },
  {
    name: "Mechanical Keyboard",
    description: "Hot-swappable mechanical keyboard",
    price_cents: 6499,
    stock: 12,
  },
  {
    name: "USB-C Hub",
    description: "7-in-1 USB-C hub for laptops",
    price_cents: 2999,
    stock: 18,
  },
  {
    name: "Laptop Stand",
    description: "Adjustable aluminum laptop stand",
    price_cents: 3499,
    stock: 10,
  },
  {
    name: "Webcam",
    description: "1080p USB webcam",
    price_cents: 4499,
    stock: 8,
  },
  {
    name: "Headphones",
    description: "Over-ear wired headphones",
    price_cents: 2999,
    stock: 20,
  },
  {
    name: "Desk Mat",
    description: "Large waterproof desk mat",
    price_cents: 1299,
    stock: 30,
  },
  {
    name: "Monitor Light",
    description: "USB monitor light bar",
    price_cents: 2499,
    stock: 14,
  },
  {
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker",
    price_cents: 3999,
    stock: 7,
  },
  {
    name: "Phone Stand",
    description: "Adjustable desktop phone stand",
    price_cents: 999,
    stock: 35,
  },
  {
    name: "Gaming Mousepad",
    description: "Extended mousepad for gaming setups",
    price_cents: 1599,
    stock: 22,
  },
  {
    name: "Power Bank",
    description: "10000mAh portable power bank",
    price_cents: 1899,
    stock: 16,
  },
  {
    name: "USB-C Cable",
    description: "Braided USB-C fast charging cable",
    price_cents: 799,
    stock: 40,
  },
  {
    name: "Portable SSD",
    description: "1TB portable solid-state drive",
    price_cents: 8499,
    stock: 5,
  },
  {
    name: "Limited Edition Keyboard",
    description: "Limited-stock mechanical keyboard",
    price_cents: 9999,
    stock: 1,
  },
];

async function seed() {
  try {
    for (const product of products) {
      await pool.query(
        `INSERT INTO products(name,description,price_cents,stock) VALUES($1,$2,$3,$4)`,
        [product.name, product.description, product.price_cents, product.stock],
      );
    }
    console.log(`Seeded ${products.length} products`);
  } catch (e) {
    console.error("Seed failed", e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
seed();
