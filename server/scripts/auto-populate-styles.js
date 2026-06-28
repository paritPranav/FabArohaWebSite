/**
 * server/scripts/auto-populate-styles.js
 *
 * Fetches every Product and Collection from MongoDB,
 * analyses titles / descriptions / tags / categories with keyword rules,
 * then writes:
 *   Product.styleFor  — one-liner occasion
 *   Collection.tagline / .occasion / .keyHighlights[]
 *
 * Run: node scripts/auto-populate-styles.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── DB connect ─────────────────────────────────────────────────────────────────
async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');
}

// ── Models (inline so we don't import the full app) ────────────────────────────
const { Schema } = mongoose;

const ProductModel = mongoose.models.Product || mongoose.model('Product', new Schema({
  title: String, description: String, tags: [String],
  category: String, subCategory: String, material: String,
  styleFor: String,
}, { strict: false }));

const CollectionModel = mongoose.models.Collection || mongoose.model('Collection', new Schema({
  name: String, description: String,
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  tagline: String, occasion: String, keyHighlights: [String],
}, { strict: false }));

// ── Keyword helpers ────────────────────────────────────────────────────────────

function blob(p) {
  return [p.title, p.description, ...(p.tags || []), p.subCategory, p.material]
    .filter(Boolean).join(' ').toLowerCase();
}

function has(text, ...words) {
  return words.some(w => text.includes(w));
}

// ── Product styleFor classifier ────────────────────────────────────────────────

const STYLE_RULES = [
  // Occasion-first rules (more specific → first)
  { label: 'Bridal & Wedding',          words: ['bridal','bride','wedding','lehenga','sherwani','baarat','mehendi','haldi','sangeet','nikah'] },
  { label: 'Festive & Ethnic',          words: ['festive','ethnic','kurta','kurti','salwar','dupatta','diwali','eid','puja','navratri','onam','ugadi','traditional','handloom','bandhani','ikat','ajrakh','phulkari','zari','zardozi','embroidered'] },
  { label: 'Office & Workwear',         words: ['office','formal','corporate','work wear','workwear','business','blazer','trouser','chinos','button-down','shirt','professional'] },
  { label: 'Beach & Resort',            words: ['beach','resort','coastal','swim','swimwear','bikini','sarong','cover-up','linen','tropical','vacation','holiday','breezy','nautical','island'] },
  { label: 'Party & Night Out',         words: ['party','night out','clubbing','cocktail','sequin','glitter','shimmer','metallic','evening','gown','little black','bodycon','crop top','miniskirt'] },
  { label: 'Active & Athleisure',       words: ['yoga','gym','workout','fitness','sport','active','athleisure','jogger','legging','track','running','cycling','stretch','quick-dry'] },
  { label: 'Maternity & Comfort',       words: ['maternity','nursing','bump','pregnancy','postpartum','comfort','plus size','oversized','loose fit','relaxed fit'] },
  { label: 'Winter & Layering',         words: ['winter','woolen','wool','knit','knitwear','sweater','sweatshirt','hoodie','jacket','coat','blazer','thermal','fleece','quilted','warm','layering','full sleeve','turtleneck'] },
  { label: 'Monsoon & Casual Outdoor',  words: ['monsoon','rain','outdoor','trek','hiking','adventure','denim','jeans','cargo'] },
  { label: 'Kids & Play',              words: ['kids','children','toddler','baby','infant','playful','cartoon','school'] },
  { label: 'Lounge & Homewear',        words: ['lounge','sleepwear','pyjama','nightwear','home wear','homewear','cozy','relax','lazy','co-ord','matching set'] },
  { label: 'Everyday Casual',           words: ['casual','everyday','weekend','day out','daily','comfortable','basic','essential','streetwear','street style','t-shirt','tee','tank','shorts'] },
  { label: 'Occasion Wear',             words: ['occasion','special','celebration','anniversary','birthday','dinner','date night','function'] },
  { label: 'Accessories Styling',       words: ['bag','tote','clutch','handbag','jewellery','jewelry','necklace','earring','bracelet','ring','scarf','stole','belt','cap','hat','sunglasses','wallet','watch'] },
];

function classifyProduct(product) {
  if (product.category === 'Kids') return 'Kids & Play';
  if (product.category === 'Accessories') return 'Everyday Styling & Accessories';

  const text = blob(product);
  for (const rule of STYLE_RULES) {
    if (has(text, ...rule.words)) return rule.label;
  }

  // Fallback by category
  const fallbacks = {
    Men:   'Everyday Casual',
    Women: 'Everyday Casual',
    Unisex:'Everyday Casual',
  };
  return fallbacks[product.category] || 'Everyday Casual';
}

// ── Collection analyser ────────────────────────────────────────────────────────

function analyseCollection(col, productDocs) {
  const colText = [col.name, col.description].filter(Boolean).join(' ').toLowerCase();
  const allText = [colText, ...productDocs.map(p => blob(p))].join(' ');

  // Count style frequencies across products
  const styleCounts = {};
  for (const p of productDocs) {
    const s = classifyProduct(p);
    styleCounts[s] = (styleCounts[s] || 0) + 1;
  }
  const topStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s)
    .slice(0, 3);

  // Materials across products
  const materials = [...new Set(
    productDocs.map(p => p.material).filter(Boolean).map(m => m.split(/[,\/]/)[0].trim())
  )].slice(0, 3);

  // ── Tagline ──────────────────────────────────────────────────────────────────
  let tagline = col.tagline; // keep if already set
  if (!tagline) {
    if (has(colText, 'summer','beach','resort','linen','breezy'))
      tagline = 'Sun-kissed style for effortless warm-weather days';
    else if (has(colText, 'winter','warm','knit','wool','cozy'))
      tagline = 'Wrapped in warmth — layered looks for cooler days';
    else if (has(colText, 'festive','ethnic','traditional','wedding','bridal'))
      tagline = 'Celebrating heritage through every stitch and weave';
    else if (has(colText, 'formal','office','work','corporate'))
      tagline = 'Sharp, refined dressing for the modern professional';
    else if (has(colText, 'casual','everyday','weekend','basics'))
      tagline = 'Easy, effortless everyday style made to love';
    else if (has(colText, 'bohemian','boho','free','spirit','nature'))
      tagline = 'Free-spirited style woven with natural elegance';
    else if (has(colText, 'minimal','clean','simple','modern'))
      tagline = 'Timeless minimalism — less noise, more statement';
    else if (has(colText, 'party','night','evening','glam'))
      tagline = 'Because every night deserves an entrance';
    else if (has(colText, 'active','yoga','sport','fitness'))
      tagline = 'Move freely, dress boldly — style that keeps up with you';
    else if (has(allText, 'handcraft','handloom','artisan','block print','khadi'))
      tagline = 'Handcrafted with love — where tradition meets contemporary design';
    else {
      // Generic but tailored to collection name
      tagline = `${col.name} — curated with care, worn with confidence`;
    }
  }

  // ── Occasion ─────────────────────────────────────────────────────────────────
  let occasion = col.occasion;
  if (!occasion) {
    const occasionParts = [];
    if (has(allText, 'beach','resort','summer','vacation')) occasionParts.push('Beach days & holidays');
    if (has(allText, 'wedding','bridal','mehendi','festive')) occasionParts.push('Weddings & celebrations');
    if (has(allText, 'office','formal','corporate','work')) occasionParts.push('Work & formal meetings');
    if (has(allText, 'party','evening','cocktail','night')) occasionParts.push('Parties & nights out');
    if (has(allText, 'casual','weekend','day out','everyday')) occasionParts.push('Casual outings & weekends');
    if (has(allText, 'yoga','gym','active','sport')) occasionParts.push('Active & wellness routines');
    if (has(allText, 'lounge','home','relax','cozy')) occasionParts.push('Lounging & home comfort');

    occasion = occasionParts.length
      ? occasionParts.slice(0, 3).join(' · ')
      : topStyles.slice(0, 2).join(' · ') || 'Everyday occasions';
  }

  // ── Key Highlights ────────────────────────────────────────────────────────────
  let keyHighlights = col.keyHighlights && col.keyHighlights.length ? col.keyHighlights : null;
  if (!keyHighlights) {
    const highlights = [];

    if (materials.length) highlights.push(materials.join(' & ') + ' fabrics');

    if (has(allText, 'handcraft','handloom','artisan','hand block','hand-block'))
      highlights.push('Handcrafted artisan pieces');
    if (has(allText, 'limited','exclusive','capsule','curated'))
      highlights.push('Limited edition collection');
    if (has(allText, 'sustainable','organic','eco','natural','earth'))
      highlights.push('Sustainably sourced materials');
    if (has(allText, 'embroidered','embroidery','zari','zardozi','mirror'))
      highlights.push('Intricate handwork & embroidery');
    if (has(allText, 'plus size','inclusive','all size','every body'))
      highlights.push('Inclusive sizing');
    if (has(allText, 'easy wash','low maintenance','wrinkle'))
      highlights.push('Easy-care fabric');
    if (productDocs.length >= 10)
      highlights.push(`${productDocs.length}+ curated styles`);
    else if (productDocs.length > 0)
      highlights.push(`${productDocs.length} carefully selected pieces`);

    const cats = [...new Set(productDocs.map(p => p.category))];
    if (cats.length > 1)
      highlights.push(`${cats.join(' & ')} styles`);

    // always at least 2 highlights
    if (highlights.length < 2) highlights.push('Signature FabAroha quality');
    if (highlights.length < 2) highlights.push('Designed for modern living');

    keyHighlights = highlights.slice(0, 5);
  }

  return { tagline, occasion, keyHighlights };
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function run() {
  await connectDB();

  // ── Products ────────────────────────────────────────────────────────────────
  console.log('\n📦  Analysing products…');
  const products = await ProductModel.find({}).lean();
  console.log(`    Found ${products.length} products`);

  let prodUpdated = 0;
  const bulkProd = [];

  for (const p of products) {
    const styleFor = classifyProduct(p);
    if (p.styleFor === styleFor) continue; // skip if already same
    bulkProd.push({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { styleFor } },
      },
    });
    prodUpdated++;
    console.log(`    [${p.category}] ${p.title.slice(0, 50).padEnd(50)} → ${styleFor}`);
  }

  if (bulkProd.length) {
    await ProductModel.bulkWrite(bulkProd);
    console.log(`✅  Updated ${prodUpdated} products`);
  } else {
    console.log('✅  All products already up-to-date');
  }

  // ── Collections ─────────────────────────────────────────────────────────────
  console.log('\n🗂️   Analysing collections…');
  const collections = await CollectionModel.find({}).lean();
  console.log(`    Found ${collections.length} collections`);

  // Build a product lookup map
  const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

  const bulkCol = [];

  for (const col of collections) {
    const productDocs = (col.products || [])
      .map(id => productMap[id.toString()])
      .filter(Boolean);

    const { tagline, occasion, keyHighlights } = analyseCollection(col, productDocs);

    const already =
      col.tagline === tagline &&
      col.occasion === occasion &&
      JSON.stringify(col.keyHighlights || []) === JSON.stringify(keyHighlights);

    if (already) { console.log(`    ⏭️  "${col.name}" — already up-to-date`); continue; }

    bulkCol.push({
      updateOne: {
        filter: { _id: col._id },
        update: { $set: { tagline, occasion, keyHighlights } },
      },
    });

    console.log(`\n    📌 "${col.name}"`);
    console.log(`       tagline:   ${tagline}`);
    console.log(`       occasion:  ${occasion}`);
    console.log(`       highlights: ${keyHighlights.join(' | ')}`);
  }

  if (bulkCol.length) {
    await CollectionModel.bulkWrite(bulkCol);
    console.log(`\n✅  Updated ${bulkCol.length} collections`);
  } else {
    console.log('\n✅  All collections already up-to-date');
  }

  // ── Save a JSON snapshot ─────────────────────────────────────────────────────
  const fs   = require('fs');
  const path = require('path');
  const snapshot = {
    generatedAt: new Date().toISOString(),
    products: products.map(p => ({
      _id: p._id, title: p.title, category: p.category, styleFor: classifyProduct(p),
    })),
    collections: collections.map(col => {
      const pd = (col.products || []).map(id => productMap[id.toString()]).filter(Boolean);
      return { _id: col._id, name: col.name, ...analyseCollection(col, pd) };
    }),
  };
  const outPath = path.join(__dirname, 'styles-snapshot.json');
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`\n📄  Snapshot saved → ${outPath}`);

  await mongoose.disconnect();
  console.log('\n🎉  Done!\n');
}

run().catch(err => {
  console.error('❌  Script failed:', err.message);
  process.exit(1);
});
