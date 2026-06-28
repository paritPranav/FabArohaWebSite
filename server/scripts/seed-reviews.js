/**
 * server/scripts/seed-reviews.js
 *
 * Seeds authentic-looking reviews for every product.
 *   • Normal products  → 10–14 reviews
 *   • Trending products → 18–25 reviews
 *   • All ratings ≥ 4 (mix of 4 and 5, avg ≈ 4.6)
 *   • Indian names, varied tones, typos, short + detailed
 *   • Dates spread over last 5 months
 *
 * Run from /server:
 *   node scripts/seed-reviews.js
 *
 * Safe to run multiple times — skips products that already have ≥ 8 reviews.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('../src/models/Product');

// ── helpers ────────────────────────────────────────────────────────────────────
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Random date within last `days` days */
function recentDate(maxDaysAgo = 150) {
  const d = new Date();
  d.setDate(d.getDate() - rand(1, maxDaysAgo));
  return d;
}

// ── reviewer pool ──────────────────────────────────────────────────────────────
const NAMES = [
  'Priya Sharma', 'Ananya Gupta', 'Sneha Patel', 'Ritu Mehta', 'Divya Krishnan',
  'Kavya Reddy', 'Meera Joshi', 'Pooja Singh', 'Nidhi Agarwal', 'Simran Kaur',
  'Pallavi Nair', 'Ankita Verma', 'Shreya Mishra', 'Ruchika Bhatia', 'Tanvi Shah',
  'Deepa Iyer', 'Neha Malhotra', 'Arya Pillai', 'Madhuri Shetty', 'Shweta Rao',
  'Rohan Kapoor', 'Aarav Sharma', 'Kiran Kumar', 'Arjun Patel', 'Vivek Singh',
  'Sameer Khan', 'Aditya Jain', 'Rahul Verma', 'Mohit Gupta', 'Rajesh Nair',
  'Ishaan Tiwari', 'Nikhil Bose', 'Varun Sood', 'Siddharth Kaur', 'Manish Dubey',
  'Sanya Malhotra', 'Tara Bhatia', 'Kriti Suri', 'Radhika Pillai', 'Lavanya Menon',
  'Ayesha Khan', 'Nandita Roy', 'Preethi Suresh', 'Garima Saxena', 'Bhavna Joshi',
  'Richa Kapoor', 'Sonali Ghosh', 'Urvashi Tiwari', 'Namita Rao', 'Chandni Verma',
];

// ── review comment bank ────────────────────────────────────────────────────────
// Each function receives the product so we can personalise slightly

const COMMENTS = {
  // Short punchy
  short: [
    'Absolutely love this! Will definitely order again.',
    'Great quality, fast delivery. Very happy!',
    'The colour is exactly as shown in the photos. Loved it!',
    'Perfect fit. My go-to now for everyday wear.',
    'Bought this as a gift and the recipient was delighted.',
    'Super comfortable. Wearing it daily!',
    'Beautiful piece. Worth every rupee.',
    'Material is really soft and breathable.',
    'Fits true to size. Very satisfied.',
    'Looks even better in person than in the photos.',
    'Fantastic! Already recommended to my friends.',
    'Simple, elegant, and great quality.',
    'Very impressed with the stitching and finish.',
    'Comfortable and stylish — the best combo!',
    'Delivered quickly and packed really well.',
    'Love the colour options. Ordered two shades.',
    'Exactly what I was looking for. No complaints!',
    'Premium feel at a very reasonable price.',
    'Ordered multiple times, never disappointed.',
    'This brand never lets me down ❤️',
  ],

  // Fabric / quality focused
  fabric: [
    'The fabric quality exceeded my expectations. Soft, not too thin, and holds its shape well after washing.',
    'Really impressed by the material — it doesn\'t wrinkle easily and the colour hasn\'t faded even after multiple washes.',
    'The stitching is really neat and the fabric feels premium. Could easily pass off as a much more expensive piece.',
    'Washed it four times already and it still looks brand new. Great quality for the price.',
    'The texture is wonderful — lightweight yet not see-through. Perfect for all day wear.',
    'I was skeptical ordering online but the fabric quality genuinely surprised me. Very soft against the skin.',
    'The material is exactly what was described — breathable and perfect for Indian summers.',
    'Excellent fabric quality. Doesn\'t pill or stretch out after washing. Really happy with this purchase.',
    'The weight of the fabric is perfect — not too heavy, not flimsy. Looks and feels elegant.',
    'Smooth, soft, and comfortable. The fabric quality is what keeps me coming back to FabAroha.',
  ],

  // Fit / sizing
  fit: [
    'Fits perfectly as per the size chart. I ordered my usual size and it was spot on.',
    'The fit is great — not too tight, not too loose. Exactly the silhouette I was hoping for.',
    'I\'m 5\'4" and ordered a Medium — fits beautifully. Flattering on all body types I think.',
    'Ordered a size up as I usually do for Indian brands and it fits like a dream.',
    'The sizing is accurate. I always worry about online purchases but this was perfect.',
    'Fits true to size. I\'m between sizes but the Medium worked perfectly for me.',
    'The cut is really flattering. Makes you look put-together with zero effort.',
    'Great fit! Definitely refer to the size guide before ordering — it\'s accurate and helpful.',
    'I ordered based on the measurements given and it fit my body perfectly. No alterations needed.',
    'The fit is very comfortable — good room in the shoulders and the length is just right.',
  ],

  // Occasion / styling
  occasion: [
    'Wore this to a colleague\'s wedding and got so many compliments! People kept asking where I got it from.',
    'Perfect for office wear — professional looking but still comfortable to sit in all day.',
    'Wore it on a trip to Goa and it was perfect for the weather. Light, breezy, and stylish.',
    'Great for both casual outings and slightly dressy occasions. Versatile piece.',
    'Bought this for festive season and it looked gorgeous. The photos don\'t do it justice.',
    'I wear this to work and it\'s smart enough for meetings yet comfortable for long hours.',
    'Styled it three different ways — casual brunch, evening dinner, and a day at the office. Works for all!',
    'Wore it to a family function — so many aunties asked where I bought it 😄',
    'Perfect for daily wear. I\'ve worn it on flights, to cafes, and on walks. So comfortable.',
    'Gifted this to my sister for her birthday and she absolutely loves it. Great choice!',
  ],

  // Delivery & packaging
  delivery: [
    'Delivery was super fast — received within 3 days of ordering. Packaging was really nice too.',
    'Well packaged, no damage in transit. Product was exactly as described.',
    'Ordered on a Monday and received by Wednesday. Impressive speed! Product is great too.',
    'The packaging was premium — felt like unboxing a gift. Product quality matched.',
    'Quick dispatch and the package arrived in perfect condition. Very professional.',
    'Delivery was on time and the product was packed beautifully. Great first impression.',
    'Smooth shopping experience from browsing to delivery. Will shop here again for sure.',
  ],

  // Value / repeat purchase
  value: [
    'Excellent value for money. The quality is honestly better than what you get at much higher prices.',
    'One of the best purchases I\'ve made online this year. Great quality at a fair price.',
    'I\'ve already ordered three more pieces from the same collection. Completely obsessed.',
    'Really good quality for the price point. Much better than similar products I\'ve tried.',
    'Bought it hesitantly thinking it might be overpriced but it\'s actually worth every paisa.',
    'This is my third order from FabAroha and each one has been excellent. Trust this brand completely.',
    'Amazing quality for the price. I was expecting average but this is genuinely impressive.',
    'I bought two — one for myself and one for my mother. Both of us love it. Great value!',
  ],

  // Detailed / mixed
  detailed: [
    'I ordered this after seeing it recommended by a friend and I\'m so glad I did. The fabric is soft and comfortable, the colour is rich and vibrant, and it fits perfectly. Delivery was prompt and packaging was neat. I\'ve already worn it three times and washed it twice — still looks brand new. Definitely ordering again!',
    'This was my first purchase from FabAroha and I\'m genuinely impressed. The product quality is top-notch — the material feels premium and the stitching is very neat. The colour in person is even better than in the photos. I was a little worried about sizing but it fit perfectly as per the size chart. Will definitely be back for more.',
    'Bought this for a family wedding and I\'m SO happy with it. Got tonnes of compliments and felt really confident wearing it. The fabric is beautiful — it drapes really well and isn\'t uncomfortable even after wearing it for hours. Price is also very reasonable for the quality you get. Highly recommend!',
    'I\'ve been shopping online for years and this is genuinely one of the better quality items I\'ve received. The material is soft without being flimsy, the colour is true to the photos, and the cut is very flattering. Arrived in 3 days, well packed. No complaints at all — I\'ve already bookmarked a few other pieces I want to try.',
    'Really thoughtfully designed piece — you can tell they\'ve paid attention to the details. The stitching at the seams is clean, the fabric has good weight to it, and it actually washes and dries quickly. I wear it to work and it stays looking fresh even at the end of a long day. Worth every rupee and more.',
    'Ordered after reading the reviews here and they were all right — this is excellent. Great fabric, great fit, great colour. The only small thing I\'d say is to size up if you\'re between sizes but otherwise it\'s perfect. Already planning my next order from here. Would give 6 stars if I could!',
    'Stunning piece — I was initially unsure about the colour online but in person it\'s absolutely gorgeous. The material is soft and breathable which is great for our climate. Washed it in cold water and it came out perfect. Got three compliments in the first week of wearing it 😊 Super happy with this purchase.',
    'I\'ve ordered from several Indian clothing brands and FabAroha is easily in the top tier for quality. The fabric feels high-end, the finishing is immaculate, and it looks exactly like the photos (which isn\'t always the case!). Delivery was faster than expected. I\'m sending my friends here — genuinely good stuff.',
  ],
};

/** Generate one comment for a product */
function generateComment(product) {
  const r = Math.random();
  if (r < 0.20) return pick(COMMENTS.short);
  if (r < 0.35) return pick(COMMENTS.fabric);
  if (r < 0.48) return pick(COMMENTS.fit);
  if (r < 0.60) return pick(COMMENTS.occasion);
  if (r < 0.68) return pick(COMMENTS.delivery);
  if (r < 0.76) return pick(COMMENTS.value);
  return pick(COMMENTS.detailed);
}

/** Pick a rating — skewed towards 5, all ≥ 4 */
function generateRating() {
  const r = Math.random();
  if (r < 0.60) return 5;
  if (r < 0.92) return 4;
  return 4; // floor at 4
}

// ── main ───────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB\n');

  const products = await Product.find({});
  console.log(`Found ${products.length} products.\n`);

  let totalAdded = 0;

  for (const product of products) {
    const existing = product.reviews.length;

    // Skip if already seeded
    if (existing >= 8) {
      console.log(`  ⏭  ${product.title} — already has ${existing} reviews, skipping`);
      continue;
    }

    const target = product.isTrending ? rand(18, 25) : rand(10, 14);
    const toAdd  = Math.max(0, target - existing);

    if (toAdd === 0) continue;

    // Shuffle names so we don't reuse the same reviewer in one product
    const shuffledNames = [...NAMES].sort(() => Math.random() - 0.5);
    const usedNames     = new Set(product.reviews.map(r => r.name));

    let added = 0;
    for (let i = 0; i < toAdd; i++) {
      // Pick a name we haven't used for this product
      let name = shuffledNames[i % shuffledNames.length];
      // If collision, append a common suffix
      if (usedNames.has(name)) {
        const suffixes = [' S.', ' K.', ' M.', ' R.', ' P.', ' A.', ' G.', ' V.'];
        name = name.split(' ')[0] + pick(suffixes);
      }
      usedNames.add(name);

      product.reviews.push({
        name,
        rating:        generateRating(),
        comment:       generateComment(product),
        isAdminReview: true,
        reviewDate:    recentDate(150),
      });
      added++;
    }

    product.updateRating();
    await product.save();
    totalAdded += added;

    console.log(
      `  ✅  ${product.title.slice(0, 45).padEnd(45)} ` +
      `| +${String(added).padStart(2)} reviews ` +
      `| avg ${product.rating.toFixed(1)} ⭐  (${product.numReviews} total)`
    );
  }

  console.log(`\n🎉  Done! Added ${totalAdded} reviews across ${products.length} products.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌  Script failed:', err.message);
  process.exit(1);
});
