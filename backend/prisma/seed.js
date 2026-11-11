/* eslint-disable no-await-in-loop */
// Demo data for local development: npm run db:seed
// Safe to run more than once — existing records (matched by slug) are left untouched.
require("dotenv/config");
const prisma = require("../prisma");
const { slugify } = require("../utils/slugify");

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;

const CATEGORIES = [
  {
    name: "Electronics",
    description: "Gadgets that feel a little like magic — sound, smart wearables and more.",
    image: img("1505740420928-5e560c06d30e"),
    subcategories: ["Headphones", "Speakers", "Smart Watches", "Cameras"],
  },
  {
    name: "Mobile Accessories",
    description: "Chargers, earbuds and everything your phone needs for the journey.",
    image: img("1590658268037-6bf12165a8df"),
    subcategories: ["Earbuds", "Chargers", "Phones"],
  },
  {
    name: "Computer Accessories",
    description: "Keyboards, mice and laptops for long nights of spell-work.",
    image: img("1587829741301-dc798b83add3"),
    subcategories: ["Keyboards", "Mice", "Laptops"],
  },
  {
    name: "Fashion",
    description: "Robes for every season — jackets, tees, dresses and shoes.",
    image: img("1551028719-00167b16eac5"),
    subcategories: ["Jackets", "T-Shirts", "Dresses", "Footwear"],
  },
  {
    name: "Accessories",
    description: "Bags, watches and sunglasses for the well-travelled.",
    image: img("1548036328-c9fa89d128fa"),
    subcategories: ["Bags", "Watches", "Sunglasses"],
  },
  {
    name: "Beauty",
    description: "Potions, perfumes and elixirs for everyday glow.",
    image: img("1541643600914-78b084683601"),
    subcategories: ["Fragrance", "Skincare", "Makeup"],
  },
  {
    name: "Home & Living",
    description: "Lamps, plants and cosy things for your own enchanted corner.",
    image: img("1507473885765-e6ed057f782c"),
    subcategories: ["Lighting", "Decor", "Kitchen", "Stationery"],
  },
  {
    name: "Grocery",
    description: "Small-batch treats — coffee, honey and chocolate.",
    image: img("1559056199-641a0ac8b55e"),
    subcategories: ["Coffee", "Pantry", "Sweets"],
  },
];

// [name, category, subcategory, price, salePrice, stock, flags, brand, image, tags, short, specs]
const PRODUCTS = [
  ["Moonlit Wireless Headphones", "Electronics", "Headphones", 18900, 15900, 24, "featured,new", "Lumos Audio", "1505740420928-5e560c06d30e", "headphones,wireless,bluetooth,noise cancelling", "Over-ear wireless headphones with 40-hour battery and soft memory-foam cups.", [["Battery", "40 hours"], ["Connectivity", "Bluetooth 5.3"], ["Weight", "250 g"]]],
  ["Alchemist Bluetooth Speaker", "Electronics", "Speakers", 12500, null, 18, "featured", "Lumos Audio", "1608043152269-423dbba4e7e1", "bluetooth speaker,speaker,portable,wireless", "Pocket-sized speaker with room-filling sound and a 12-hour battery.", [["Battery", "12 hours"], ["Water resistance", "IPX5"], ["Output", "10 W"]]],
  ["Stargazer Smart Watch", "Electronics", "Smart Watches", 32500, 28900, 9, "featured,new", "Orbit", "1546868871-7041f2a55e12", "smart watch,fitness,watch", "Tracks steps, sleep and heart-rate under a bright always-on display.", [["Display", "1.8\" AMOLED"], ["Battery", "7 days"], ["Water resistance", "5 ATM"]]],
  ["Instant Memory Camera", "Electronics", "Cameras", 45000, null, 5, "new", "Pensieve", "1516035069371-29a1b244cc32", "camera,instant camera,photo", "Capture moments and hold them in your hand seconds later.", [["Film", "Instant mini"], ["Flash", "Auto"], ["Batteries", "2 × AA"]]],
  ["Whisper True Wireless Earbuds", "Mobile Accessories", "Earbuds", 9900, 7900, 40, "featured", "Lumos Audio", "1590658268037-6bf12165a8df", "earbuds,wireless,bluetooth", "Tiny earbuds with a charging case and touch controls.", [["Battery", "6 + 24 hours"], ["Charging", "USB-C"]]],
  ["Ember Power Bank 10,000 mAh", "Mobile Accessories", "Chargers", 4500, null, 60, "", "Ember", "1609091839311-d5365f9ff1c5", "power bank,charger,usb-c,fast charging", "Slim 10,000 mAh power bank that charges a phone about twice.", [["Capacity", "10,000 mAh"], ["Ports", "USB-C + USB-A"]]],
  ["Nightfall Smartphone 128GB", "Mobile Accessories", "Phones", 89900, 84900, 4, "new", "Orbit", "1511707171634-5f897ff02aa9", "phone,smartphone,mobile", "A sleek phone with an all-day battery and a crisp camera.", [["Storage", "128 GB"], ["Display", "6.1\""], ["Camera", "48 MP"]]],
  ["Runebound Mechanical Keyboard", "Computer Accessories", "Keyboards", 21500, null, 12, "featured", "Scriptorium", "1587829741301-dc798b83add3", "keyboard,mechanical,rgb", "Tactile mechanical keyboard with warm backlighting.", [["Switches", "Tactile brown"], ["Layout", "75%"], ["Connection", "USB-C / Bluetooth"]]],
  ["Featherlight Wireless Mouse", "Computer Accessories", "Mice", 5900, 4900, 35, "", "Scriptorium", "1527864550417-7fd91fc51a46", "mouse,wireless,computer", "Silent clicks, ergonomic shape and months of battery.", [["DPI", "800–3200"], ["Battery", "AA, 12 months"]]],
  ["Scholar Ultrabook 14\"", "Computer Accessories", "Laptops", 245000, 229000, 3, "featured", "Orbit", "1496181133206-80ce9b88a853", "laptop,ultrabook,computer", "Thin, light and fast — built for long study sessions.", [["Memory", "16 GB"], ["Storage", "512 GB SSD"], ["Display", "14\" FHD"]]],
  ["Dragonhide Leather Jacket", "Fashion", "Jackets", 38500, null, 7, "featured,new", "Wandering Robes", "1551028719-00167b16eac5", "jacket,leather,outerwear", "A classic leather jacket that only gets better with age.", [["Material", "Genuine leather"], ["Fit", "Regular"]]],
  ["Everyday Cotton Tee", "Fashion", "T-Shirts", 3200, 2500, 80, "", "Wandering Robes", "1521572163474-6864f9cf17ab", "t-shirt,tee,cotton", "Soft, breathable cotton tee for every day of the week.", [["Material", "100% cotton"], ["Fit", "Relaxed"]]],
  ["Midsummer Floral Dress", "Fashion", "Dresses", 8900, null, 15, "new", "Wandering Robes", "1595777457583-95e059d581b8", "dress,floral,summer", "Light, flowing dress for warm evenings.", [["Material", "Viscose"], ["Length", "Midi"]]],
  ["Swiftfoot Running Sneakers", "Fashion", "Footwear", 16500, 13900, 20, "featured", "Nimbus", "1542291026-7eec264c27ff", "sneakers,shoes,running", "Cushioned sneakers that feel like flying.", [["Upper", "Breathable mesh"], ["Sole", "Foam"]]],
  ["Wanderer Leather Backpack", "Accessories", "Bags", 14500, null, 11, "", "Wandering Robes", "1553062407-98eeb64c6a62", "backpack,bag,leather", "Roomy backpack with a padded laptop sleeve.", [["Capacity", "22 L"], ["Laptop sleeve", "15\""]]],
  ["Weekender Travel Bag", "Accessories", "Bags", 19500, 16500, 6, "featured", "Wandering Robes", "1548036328-c9fa89d128fa", "bag,travel bag,weekender", "Everything you need for a weekend away, in one bag.", [["Capacity", "35 L"]]],
  ["Clocktower Classic Watch", "Accessories", "Watches", 27500, null, 8, "new", "Orbit", "1523275335684-37898b6baf30", "watch,classic,analog", "Minimal analog watch with a leather strap.", [["Case", "40 mm"], ["Movement", "Quartz"]]],
  ["Shadow Polarised Sunglasses", "Accessories", "Sunglasses", 6500, 5200, 25, "", "Nimbus", "1572635196237-14b3f281503f", "sunglasses,polarised,uv", "Polarised lenses with full UV400 protection.", [["Lens", "Polarised UV400"]]],
  ["Midnight Velvet Eau de Parfum", "Beauty", "Fragrance", 15900, null, 14, "featured", "Elixir & Co.", "1541643600914-78b084683601", "perfume,fragrance", "Warm amber and vanilla with a whisper of smoke.", [["Volume", "50 ml"], ["Notes", "Amber, vanilla, cedar"]]],
  ["Glow Potion Skincare Set", "Beauty", "Skincare", 9800, 8500, 19, "new", "Elixir & Co.", "1556228578-8c89e6adf883", "skincare,serum,set", "Cleanser, serum and moisturiser for a simple daily ritual.", [["Includes", "3 items"], ["Skin type", "All"]]],
  ["Enchanted Lip Collection", "Beauty", "Makeup", 5400, null, 0, "", "Elixir & Co.", "1586495777744-4413f21062fa", "lipstick,makeup", "Four long-wearing lip shades in a keepsake box.", [["Shades", "4"]]],
  ["Ember Glow Desk Lamp", "Home & Living", "Lighting", 7900, 6900, 16, "featured", "Hearth", "1507473885765-e6ed057f782c", "lamp,desk lamp,lighting", "Warm, dimmable light for reading late into the night.", [["Bulb", "LED, 3 levels"]]],
  ["Herbology Plant Trio", "Home & Living", "Decor", 4900, null, 10, "new", "Hearth", "1485955900006-10f4d324d411", "plants,decor,indoor", "Three easy-care indoor plants in ceramic pots.", [["Includes", "3 plants + pots"]]],
  ["Cauldron Ceramic Mug", "Home & Living", "Kitchen", 1900, null, 50, "", "Hearth", "1514228742587-6b1558fcca3d", "mug,ceramic,coffee", "Hand-glazed mug for your morning brew.", [["Capacity", "350 ml"]]],
  ["Market Canvas Tote", "Accessories", "Bags", 2800, 2200, 45, "", "Wandering Robes", "1544816155-12df9643f363", "tote,bag,canvas,shopping bag", "Sturdy canvas tote for the market, the beach or every day.", [["Material", "Heavy canvas"], ["Size", "38 × 42 cm"]]],
  ["Highland Coffee Beans 500g", "Grocery", "Coffee", 3600, null, 30, "", "Hearth Pantry", "1559056199-641a0ac8b55e", "coffee,beans,arabica", "Medium-roast Sri Lankan highland arabica.", [["Weight", "500 g"], ["Roast", "Medium"]]],
  ["Island Watermelon", "Grocery", "Pantry", 900, null, 22, "new", "Hearth Pantry", "1587049352846-4a222e784d38", "watermelon,fruit,fresh", "Sweet, juicy watermelon from local farms, picked ripe.", [["Weight", "About 3 kg"]]],
  ["Dark Chocolate Truffles", "Grocery", "Sweets", 3200, 2800, 18, "", "Hearth Pantry", "1481391319762-47dff72954d9", "chocolate,truffles,gift", "Rich dark-chocolate truffles in a gift box.", [["Pieces", "12"]]],
];

const BANNERS = [
  {
    title: "Step into the Alley",
    subtitle: "Every curious find — electronics, fashion, home and more — gathered in one enchanted street.",
    imageUrl: img("1519681393784-d120267933ba"),
    buttonText: "Explore the shop",
    buttonLink: "/shop",
    placement: "HERO",
    sortOrder: 0,
  },
  {
    title: "Fresh from the Cauldron",
    subtitle: "New arrivals every week. Be the first to find them.",
    imageUrl: img("1481627834876-b7833e8f5570"),
    buttonText: "See new arrivals",
    buttonLink: "/shop?newArrival=true",
    placement: "HERO",
    sortOrder: 1,
  },
  {
    title: "Enchanted Offers",
    subtitle: "Up to 20% off selected gadgets this month.",
    imageUrl: img("1505740420928-5e560c06d30e"),
    buttonText: "Shop the sale",
    buttonLink: "/shop?onSale=true",
    placement: "PROMO",
    sortOrder: 0,
  },
  {
    title: "Robes for every season",
    subtitle: "New fashion pieces just landed.",
    imageUrl: img("1551028719-00167b16eac5"),
    buttonText: "Shop fashion",
    buttonLink: "/category/fashion",
    placement: "PROMO",
    sortOrder: 1,
  },
];

// the page title is already shown as the page heading, so the body starts straight with the text
const placeholderPage = (title, body) => `${body}\n<p><em>This is placeholder text — edit it from Admin → Pages.</em></p>`;

const PAGES = [
  ["about", "About Us", "<p>Diagon Store is a little alley of everyday magic: carefully chosen electronics, fashion, beauty, home goods and treats, all in one place. Browse, add what you love to your cart, and send us your order on WhatsApp or email — we’ll confirm and deliver to your door, cash on delivery.</p>"],
  ["privacy-policy", "Privacy Policy", "<p>We collect only the details needed to process your order (name, phone, email and address) and never sell them to anyone.</p>"],
  ["terms", "Terms & Conditions", "<p>All orders are subject to availability and confirmation by Diagon Store. Prices are in LKR and may change without notice.</p>"],
  ["delivery-information", "Delivery Information", "<p>We deliver island-wide. Delivery times and charges are confirmed when we contact you about your order. Payment is cash on delivery.</p>"],
  ["return-policy", "Return & Refund Policy", "<p>If an item arrives damaged or incorrect, contact us within 7 days of delivery and we will arrange an exchange or refund.</p>"],
];

async function main() {
  console.log("Seeding categories...");
  const categoryIds = {};
  const subcategoryIds = {};

  for (const [index, c] of CATEGORIES.entries()) {
    const slug = slugify(c.name);
    const category = await prisma.category.upsert({
      where: { slug },
      create: { name: c.name, slug, description: c.description, imageUrl: c.image, sortOrder: index },
      update: {},
    });
    categoryIds[c.name] = category.id;

    for (const [subIndex, subName] of c.subcategories.entries()) {
      const subSlug = slugify(subName);
      const sub = await prisma.subcategory.upsert({
        where: { slug_categoryId: { slug: subSlug, categoryId: category.id } },
        create: { name: subName, slug: subSlug, categoryId: category.id, sortOrder: subIndex },
        update: {},
      });
      subcategoryIds[`${c.name}/${subName}`] = sub.id;
    }
  }

  console.log("Seeding products...");
  let created = 0;
  for (const [index, p] of PRODUCTS.entries()) {
    const [name, cat, sub, price, salePrice, stock, flags, brand, imageId, tags, shortDescription, specs] = p;
    const slug = slugify(name);
    if (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) continue;

    await prisma.product.create({
      data: {
        name,
        slug,
        sku: `DS-${1001 + index}`,
        brand,
        shortDescription,
        description: `<p>${shortDescription}</p><p>Every item at Diagon Store is checked before it leaves the alley. Order on WhatsApp or email and pay on delivery.</p>`,
        price,
        salePrice,
        stock,
        status: stock === 0 ? "OUT_OF_STOCK" : "ACTIVE",
        tags,
        specifications: specs.map(([label, value]) => ({ label, value })),
        isFeatured: flags.includes("featured"),
        isNewArrival: flags.includes("new"),
        viewCount: Math.floor(Math.random() * 200),
        categoryId: categoryIds[cat],
        subcategoryId: subcategoryIds[`${cat}/${sub}`],
        images: { create: [{ url: img(imageId), altText: name, sortOrder: 0 }] },
      },
    });
    created += 1;
  }
  console.log(`  ${created} new products`);

  if ((await prisma.banner.count()) === 0) {
    console.log("Seeding banners...");
    await prisma.banner.createMany({ data: BANNERS });
  }

  console.log("Seeding pages...");
  for (const [slug, title, body] of PAGES) {
    await prisma.page.upsert({
      where: { slug },
      create: { slug, title, content: placeholderPage(title, body) },
      update: {},
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
