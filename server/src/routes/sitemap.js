// server/src/routes/sitemap.js
const express = require('express');
const router  = express.Router();
const Product    = require('../models/Product');
const { Collection } = require('../models/OrderCollection');

const STATIC_PAGES = [
  { path: '/',            priority: 1.0, changefreq: 'daily'   },
  { path: '/products',    priority: 0.9, changefreq: 'daily'   },
  { path: '/collections', priority: 0.8, changefreq: 'weekly'  },
  { path: '/discover',    priority: 0.8, changefreq: 'daily'   },
  { path: '/about',       priority: 0.5, changefreq: 'monthly' },
  { path: '/our-story',   priority: 0.5, changefreq: 'monthly' },
  { path: '/size-guide',  priority: 0.4, changefreq: 'monthly' },
  { path: '/contact',     priority: 0.4, changefreq: 'monthly' },
];

// ─── GET /api/sitemap/data ────────────────────────────────────────────────────
// Consumed by Next.js sitemap.ts (ISR, daily revalidation)
router.get('/data', async (req, res) => {
  try {
    const [products, collections] = await Promise.all([
      Product.find({ isActive: true })
        .select('slug sku updatedAt')
        .lean(),
      Collection.find({ isActive: true, isDeleted: false })
        .select('slug updatedAt')
        .lean(),
    ]);
    res.json({ products, collections, staticPages: STATIC_PAGES });
  } catch (err) {
    console.error('[sitemap/data]', err);
    res.status(500).json({ message: 'Failed to fetch sitemap data' });
  }
});

// ─── GET /api/sitemap/google-shopping-feed.xml ────────────────────────────────
// Google Merchant Center RSS 2.0 product feed
router.get('/google-shopping-feed.xml', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('title slug description price discountedPrice images category subCategory sku totalStock updatedAt')
      .lean();

    const siteUrl = process.env.CLIENT_URL || 'https://fabaroha.com';

    // Google Product Taxonomy numeric IDs (Apparel & Accessories sub-trees)
    const categoryMap = {
      Men:         '212',   // Apparel & Accessories > Clothing
      Women:       '212',
      Unisex:      '212',
      Kids:        '182',   // Apparel & Accessories > Clothing > Children's Clothing
      Accessories: '178',   // Apparel & Accessories > Jewelry
    };

    const items = products.map(p => {
      const availability = p.totalStock > 0 ? 'in stock' : 'out of stock';
      const salePrice    = p.discountedPrice;
      const listPrice    = p.price;
      const mainImage    = p.images?.[0] ?? '';
      const extraImages  = (p.images ?? []).slice(1, 10);
      const gCategory    = categoryMap[p.category] ?? '212';
      const productType  = [p.category, p.subCategory].filter(Boolean).join(' > ');

      const extraImgLines = extraImages
        .map(img => `      <g:additional_image_link>${esc(img)}</g:additional_image_link>`)
        .join('\n');

      return `    <item>
      <g:id>${esc(p.sku)}</g:id>
      <g:title>${esc(p.title)}</g:title>
      <g:description>${esc((p.description ?? '').substring(0, 5000))}</g:description>
      <g:link>${siteUrl}/products/${esc(p.slug)}</g:link>
      <g:image_link>${esc(mainImage)}</g:image_link>
${extraImgLines ? extraImgLines + '\n' : ''}      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${listPrice.toFixed(2)} INR</g:price>
${salePrice ? `      <g:sale_price>${salePrice.toFixed(2)} INR</g:sale_price>\n` : ''}      <g:brand>FabAroha</g:brand>
      <g:google_product_category>${gCategory}</g:google_product_category>
      <g:product_type>${esc(productType)}</g:product_type>
      <g:item_group_id>${esc(p.slug)}</g:item_group_id>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>FabAroha - Earthwear Fashion</title>
    <link>${siteUrl}</link>
    <description>FabAroha Earthwear — Sustainable Fashion for Everyone</description>
${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    res.send(xml);
  } catch (err) {
    console.error('[sitemap/google-shopping-feed]', err);
    res.status(500).json({ message: 'Failed to generate Google Shopping feed' });
  }
});

// XML entity escaping
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = router;
