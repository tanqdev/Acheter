import { pool } from "../server/src/db/pool";

const products = [
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with adjustable DPI",
    price_cents: 89900,
    stock: 25,
    image_url:
      "/images/products/wireless-mouse.webp",
    hover_image_url:
      "/images/products/wireless-mouse-hover.webp",
  },
  {
    name: "Mechanical Keyboard",
    description: "Hot-swappable mechanical keyboard",
    price_cents: 549900,
    stock: 12,
    image_url:
      "/images/products/mechanical-keyboard.webp",
    hover_image_url:
      "/images/products/mechanical-keyboard-hover.webp",
  },
  {
    name: "USB-C Hub",
    description: "7-in-1 USB-C hub for laptops",
    price_cents: 199900,
    stock: 18,
    image_url:
      "/images/products/usb-c-hub.webp",
    hover_image_url:
      "/images/products/usb-c-hub-hover.webp",
  },
  {
    name: "Laptop Stand",
    description: "Adjustable aluminum laptop stand",
    price_cents: 179900,
    stock: 10,
    image_url:
      "/images/products/laptop-stand.webp",
    hover_image_url:
      "/images/products/laptop-stand-hover.webp",
  },
  {
    name: "Webcam",
    description: "1080p USB webcam",
    price_cents: 249900,
    stock: 8,
    image_url:
      "/images/products/webcam.webp",
    hover_image_url:
      "/images/products/webcam-hover.webp",
  },
  {
    name: "Headphones",
    description: "Over-ear wired headphones",
    price_cents: 199900,
    stock: 20,
    image_url:
      "/images/products/headphones.webp",
    hover_image_url:
      "/images/products/headphones-hover.webp",
  },
  {
    name: "Desk Mat",
    description: "Large waterproof desk mat",
    price_cents: 69900,
    stock: 30,
    image_url:
      "/images/products/desk-mat.webp",
    hover_image_url:
      "/images/products/desk-mat-hover.webp",
  },
  {
    name: "Monitor Light",
    description: "USB monitor light bar",
    price_cents: 149900,
    stock: 14,
    image_url:
      "/images/products/monitor-light.webp",
    hover_image_url:
      "/images/products/monitor-light-hover.webp",
  },
  {
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker",
    price_cents: 299900,
    stock: 7,
    image_url:
      "/images/products/bluetooth-speaker.webp",
    hover_image_url:
      "/images/products/bluetooth-speaker-hover.webp",
  },
  {
    name: "Phone Stand",
    description: "Adjustable desktop phone stand",
    price_cents: 49900,
    stock: 35,
    image_url:
      "/images/products/phone-stand.webp",
    hover_image_url:
      "/images/products/phone-stand-hover.webp",
  },
  {
    name: "Gaming Mousepad",
    description: "Extended mousepad for gaming setups",
    price_cents: 89900,
    stock: 22,
    image_url:
      "/images/products/gaming-mousepad.webp",
    hover_image_url:
      "/images/products/gaming-mousepad-hover.webp",
  },
  {
    name: "Power Bank",
    description: "10000mAh portable power bank",
    price_cents: 149900,
    stock: 16,
    image_url:
      "/images/products/power-bank.webp",
    hover_image_url:
      "/images/products/power-bank-hover.webp",
  },
  {
    name: "USB-C Cable",
    description: "Braided USB-C fast charging cable",
    price_cents: 39900,
    stock: 40,
    image_url:
      "/images/products/usb-c-cable.webp",
    hover_image_url:
      "/images/products/usb-c-cable-hover.webp",
  },
  {
    name: "Portable SSD",
    description: "1TB portable solid-state drive",
    price_cents: 699900,
    stock: 5,
    image_url:
      "/images/products/portable-ssd.webp",
    hover_image_url:
      "/images/products/portable-ssd-hover.webp",
  },
  {
    name: "Limited Edition Keyboard",
    description: "Limited-stock mechanical keyboard",
    price_cents: 899900,
    stock: 1,
    image_url:
      "/images/products/limited-edition-keyboard.webp",
    hover_image_url:
      "/images/products/limited-edition-keyboard-hover.webp",
  },
];

async function seed() {
  try {
    for (const product of products) {
      const result = await pool.query(
        `UPDATE products
     SET price_cents = $2,
         image_url = $3,
         hover_image_url = $4
     WHERE name = $1`,
        [
          product.name,
          product.price_cents,
          product.image_url,
          product.hover_image_url,
        ],
      );

      if (result.rowCount === 0) {
        console.warn(`Product not found: ${product.name}`);
      }
    }

    console.log("Updated product catalog");
  } catch (e) {
    console.error("Seed failed", e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
