// server/src/utils/invoice.js
// Generates professional GST-compliant tax invoices as PDF buffers
const PDFDocument = require('pdfkit');

// ── GST helpers ───────────────────────────────────────────────────────────────

/**
 * Returns the GST rate for a given final (inclusive) price.
 * < ₹2500  → 5%   (2.5% CGST + 2.5% SGST)
 * ≥ ₹2500  → 18%  (9%   CGST + 9%   SGST)
 */
function gstRateForPrice(finalPrice) {
  return finalPrice < 2500 ? 0.05 : 0.18;
}

/**
 * Given a GST-inclusive final price, returns the breakdown:
 *   { basePrice, gstRate, gstAmount, cgst, sgst }
 */
function gstBreakdown(finalPrice) {
  const rate      = gstRateForPrice(finalPrice);
  const basePrice = finalPrice / (1 + rate);
  const gstAmount = finalPrice - basePrice;
  return {
    basePrice: +basePrice.toFixed(2),
    gstRate:   rate,
    gstRatePct: (rate * 100),
    gstAmount: +gstAmount.toFixed(2),
    cgst:      +(gstAmount / 2).toFixed(2),
    sgst:      +(gstAmount / 2).toFixed(2),
  };
}

/**
 * Builds a full GST summary across all order items.
 * Returns an array grouped by GST rate slab.
 */
function buildGstSummary(items) {
  const slabs = {}; // key: gstRatePct
  for (const item of items) {
    const lineTotal = item.price * item.quantity;
    const { gstRatePct, basePrice, gstAmount, cgst, sgst } = gstBreakdown(lineTotal);
    const key = gstRatePct.toString();
    if (!slabs[key]) {
      slabs[key] = { gstRatePct, taxableAmount: 0, cgst: 0, sgst: 0, gstAmount: 0 };
    }
    slabs[key].taxableAmount += basePrice;
    slabs[key].cgst          += cgst;
    slabs[key].sgst          += sgst;
    slabs[key].gstAmount     += gstAmount;
  }
  return Object.values(slabs).map(s => ({
    ...s,
    taxableAmount: +s.taxableAmount.toFixed(2),
    cgst:          +s.cgst.toFixed(2),
    sgst:          +s.sgst.toFixed(2),
    gstAmount:     +s.gstAmount.toFixed(2),
  }));
}

// ── Invoice number generator ──────────────────────────────────────────────────

function generateInvoiceNumber(order) {
  if (order.invoiceNumber) return order.invoiceNumber;
  const date  = new Date(order.createdAt || Date.now());
  const year  = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const short = order._id.toString().slice(-6).toUpperCase();
  return `FAB-${year}${month}-${short}`;
}

// ── PDF layout constants ──────────────────────────────────────────────────────

const BRAND_BROWN = '#3D2E22';
const BRAND_CREAM = '#FAF7F2';
const BRAND_SAGE  = '#8FAF89';
const BRAND_TAN   = '#C5B8A8';
const TEXT_MUTED  = '#9B8EA0';
const PAGE_W      = 595.28; // A4 width pts
const PAGE_H      = 841.89;
const MARGIN      = 40;
const COL_W       = PAGE_W - MARGIN * 2;

// ── PDF helpers ───────────────────────────────────────────────────────────────

function inr(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawHRule(doc, y, color = '#E8E0D6', width = COL_W) {
  doc.save().strokeColor(color).lineWidth(0.5).moveTo(MARGIN, y).lineTo(MARGIN + width, y).stroke().restore();
}

function tableHeader(doc, y, cols) {
  doc.save().fillColor(BRAND_BROWN).rect(MARGIN, y, COL_W, 22).fill().restore();
  let x = MARGIN;
  for (const col of cols) {
    doc.save().fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
       .text(col.label, x + 4, y + 7, { width: col.w - 8, align: col.align || 'left' })
       .restore();
    x += col.w;
  }
  return y + 22;
}

function tableRow(doc, y, cols, values, isAlt = false) {
  if (isAlt) {
    doc.save().fillColor('#F5F0EB').rect(MARGIN, y, COL_W, 20).fill().restore();
  }
  let x = MARGIN;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const val = values[i] ?? '';
    doc.save().fillColor(BRAND_BROWN).fontSize(8).font('Helvetica')
       .text(String(val), x + 4, y + 6, { width: col.w - 8, align: col.align || 'left', lineBreak: false })
       .restore();
    x += col.w;
  }
  return y + 20;
}

// ── Main PDF generator ────────────────────────────────────────────────────────

/**
 * Generates a GST Tax Invoice PDF for the given order.
 * @param {object} order  - Mongoose Order document (lean or full)
 * @param {object} user   - Customer User document
 * @returns {Promise<Buffer>} - PDF as a Buffer
 */
function generateInvoicePDF(order, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc     = new PDFDocument({ size: 'A4', margin: MARGIN, compress: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end',  ()    => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const invoiceNo   = generateInvoiceNumber(order);
      const invoiceDate = new Date(order.createdAt || Date.now());
      const orderId     = order._id.toString().slice(-10).toUpperCase();

      // ── HEADER BANNER ──────────────────────────────────────────────────────
      doc.save().fillColor(BRAND_BROWN).rect(0, 0, PAGE_W, 90).fill().restore();

      // Brand name
      doc.save().fillColor(BRAND_CREAM).font('Helvetica-Bold').fontSize(28)
         .text('FabAroha', MARGIN, 22, { align: 'left' }).restore();

      // Tagline
      doc.save().fillColor(BRAND_TAN).font('Helvetica').fontSize(9).characterSpacing(1.5)
         .text('STYLE · COMFORT · ELEGANCE', MARGIN, 56, { align: 'left' }).restore();

      // TAX INVOICE label on right
      doc.save().fillColor(BRAND_SAGE).font('Helvetica-Bold').fontSize(13).characterSpacing(1)
         .text('TAX INVOICE', 0, 30, { width: PAGE_W - MARGIN, align: 'right' }).restore();
      doc.save().fillColor(BRAND_TAN).font('Helvetica').fontSize(8)
         .text('GST Compliant', 0, 50, { width: PAGE_W - MARGIN, align: 'right' }).restore();

      let y = 110;

      // ── INVOICE META  ──────────────────────────────────────────────────────
      // Left: Invoice info
      const metaLeft  = MARGIN;
      const metaRight = PAGE_W / 2 + 10;

      // Invoice info box
      doc.save().fillColor('#F5F0EB').roundedRect(metaLeft, y, COL_W / 2 - 8, 70, 6).fill().restore();
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
         .text('INVOICE NUMBER', metaLeft + 10, y + 10).restore();
      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(11)
         .text(invoiceNo, metaLeft + 10, y + 22).restore();
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
         .text('DATE', metaLeft + 10, y + 40).restore();
      doc.save().fillColor(BRAND_BROWN).font('Helvetica').fontSize(9)
         .text(invoiceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), metaLeft + 10, y + 51).restore();

      // Order info box
      doc.save().fillColor('#F5F0EB').roundedRect(metaRight, y, COL_W / 2 - 8, 70, 6).fill().restore();
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
         .text('ORDER ID', metaRight + 10, y + 10).restore();
      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(11)
         .text('#' + orderId, metaRight + 10, y + 22).restore();
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
         .text('ORDER TYPE', metaRight + 10, y + 40).restore();
      doc.save().fillColor(BRAND_BROWN).font('Helvetica').fontSize(9)
         .text(order.isOfflineOrder ? 'In-Store / Offline' : 'Online', metaRight + 10, y + 51).restore();

      y += 82;

      // ── BILLING & SHIPPING ─────────────────────────────────────────────────
      const addr = order.shippingAddress || {};

      // Billed To
      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(8.5)
         .text('BILLED TO', metaLeft, y).restore();
      drawHRule(doc, y + 13, BRAND_SAGE, COL_W / 2 - 8);
      const custName  = addr.fullName || user?.name || 'Customer';
      const custPhone = addr.phone || user?.phone || '';
      const custEmail = user?.email || '';
      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(9)
         .text(custName, metaLeft, y + 18).restore();
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(8)
         .text([custPhone, custEmail].filter(Boolean).join('  |  '), metaLeft, y + 31).restore();

      // Delivered / Ship To
      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(8.5)
         .text('SHIP TO', metaRight, y).restore();
      drawHRule(doc, y + 13, BRAND_SAGE, COL_W / 2 - 8);
      const addrLine = [
        addr.line1,
        addr.line2,
        [addr.city, addr.state].filter(Boolean).join(', '),
        addr.pincode,
        addr.country || 'India',
      ].filter(Boolean).join('\n');
      doc.save().fillColor(BRAND_BROWN).font('Helvetica').fontSize(8.5).lineGap(2)
         .text(addrLine || 'N/A', metaRight, y + 18, { width: COL_W / 2 - 12 }).restore();

      y += 75;

      // ── ITEMS TABLE ────────────────────────────────────────────────────────
      const COLS = [
        { label: '#',           w: 24,  align: 'center' },
        { label: 'Item',        w: 160, align: 'left'   },
        { label: 'Size/Color',  w: 70,  align: 'center' },
        { label: 'Qty',         w: 30,  align: 'center' },
        { label: 'Unit Price',  w: 65,  align: 'right'  },
        { label: 'GST %',       w: 40,  align: 'center' },
        { label: 'GST Amt',     w: 60,  align: 'right'  },
        { label: 'Total',       w: 66,  align: 'right'  },
      ];

      y = tableHeader(doc, y, COLS);

      let totalTaxable = 0;
      let totalGst     = 0;
      let totalCgst    = 0;
      let totalSgst    = 0;

      (order.items || []).forEach((item, idx) => {
        const lineTotal = item.price * item.quantity;
        const { basePrice, gstRatePct, gstAmount, cgst, sgst } = gstBreakdown(lineTotal);
        totalTaxable += basePrice;
        totalGst     += gstAmount;
        totalCgst    += cgst;
        totalSgst    += sgst;

        const unitBase = basePrice / item.quantity;
        const sizeColor = [item.size, item.color].filter(Boolean).join(' / ') || '—';

        y = tableRow(doc, y, COLS, [
          idx + 1,
          item.title,
          sizeColor,
          item.quantity,
          inr(unitBase),
          `${gstRatePct}%`,
          inr(gstAmount),
          inr(lineTotal),
        ], idx % 2 === 1);
      });

      drawHRule(doc, y + 2);
      y += 12;

      // ── GST SUMMARY TABLE ──────────────────────────────────────────────────
      const gstSlabs = buildGstSummary(order.items || []);

      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(8.5)
         .text('GST SUMMARY', MARGIN, y).restore();
      y += 14;

      const GST_COLS = [
        { label: 'GST Rate', w: 70,  align: 'center' },
        { label: 'Taxable Amt', w: 110, align: 'right' },
        { label: 'CGST', w: 80,  align: 'right' },
        { label: 'SGST', w: 80,  align: 'right' },
        { label: 'Total GST', w: 95,  align: 'right' },
        { label: '', w: COL_W - 435, align: 'right' },
      ];

      y = tableHeader(doc, y, GST_COLS);
      gstSlabs.forEach((slab, idx) => {
        y = tableRow(doc, y, GST_COLS, [
          `${slab.gstRatePct}%`,
          inr(slab.taxableAmount),
          inr(slab.cgst),
          inr(slab.sgst),
          inr(slab.gstAmount),
          '',
        ], idx % 2 === 1);
      });

      drawHRule(doc, y + 2);
      y += 14;

      // ── TOTALS SUMMARY ─────────────────────────────────────────────────────
      const summaryX = PAGE_W / 2 + 30;
      const summaryW = PAGE_W - MARGIN - summaryX;

      const couponDisc = order.discount || 0;
      const addDisc    = order.additionalDiscount || 0;
      const grandTotal = order.totalAmount;

      const rows = [
        ['Subtotal (taxable)', inr(totalTaxable)],
        ['CGST', inr(totalCgst)],
        ['SGST', inr(totalSgst)],
        ['Total GST', inr(totalGst)],
      ];

      if (couponDisc > 0) rows.push([`Coupon (${order.couponCode || ''})`, `− ${inr(couponDisc)}`]);
      if (addDisc > 0)    rows.push([`Extra Discount (${order.additionalDiscountName || 'Store'})`, `− ${inr(addDisc)}`]);
      if (order.shippingCharge > 0) rows.push(['Shipping', inr(order.shippingCharge)]);
      else rows.push(['Shipping', 'FREE']);

      rows.forEach(([label, val]) => {
        doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(8.5)
           .text(label, summaryX, y, { width: summaryW - 10, align: 'left' }).restore();
        doc.save().fillColor(BRAND_BROWN).font('Helvetica').fontSize(8.5)
           .text(val, summaryX, y, { width: summaryW, align: 'right' }).restore();
        y += 15;
      });

      drawHRule(doc, y, BRAND_BROWN, summaryW);
      y += 6;

      // Grand total
      doc.save().fillColor(BRAND_BROWN).fillOpacity(1)
         .rect(summaryX - 4, y - 2, summaryW + 4, 24).fill().restore();
      doc.save().fillColor(BRAND_CREAM).font('Helvetica-Bold').fontSize(11)
         .text('GRAND TOTAL', summaryX + 2, y + 5, { width: summaryW - 8, align: 'left' }).restore();
      doc.save().fillColor(BRAND_CREAM).font('Helvetica-Bold').fontSize(11)
         .text(inr(grandTotal), summaryX + 2, y + 5, { width: summaryW - 2, align: 'right' }).restore();
      y += 32;

      // ── PAYMENT INFO ───────────────────────────────────────────────────────
      const payLabels = {
        razorpay:      'Online (Razorpay)',
        cod:           'Cash on Delivery',
        cash:          'Cash',
        upi:           'UPI',
        card:          'Card',
        bank_transfer: 'Bank Transfer',
      };

      doc.save().fillColor('#EEF6EE').roundedRect(MARGIN, y, COL_W, 30, 4).fill().restore();
      doc.save().fillColor(BRAND_SAGE).font('Helvetica-Bold').fontSize(8)
         .text('PAYMENT METHOD', MARGIN + 10, y + 8).restore();
      doc.save().fillColor(BRAND_BROWN).font('Helvetica').fontSize(9)
         .text(payLabels[order.paymentMethod] || order.paymentMethod, MARGIN + 110, y + 7).restore();

      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(8)
         .text('STATUS', MARGIN + 260, y + 8).restore();
      const statusColor = order.paymentStatus === 'paid' ? BRAND_SAGE : '#C0392B';
      doc.save().fillColor(statusColor).font('Helvetica-Bold').fontSize(9)
         .text((order.paymentStatus || 'pending').toUpperCase(), MARGIN + 300, y + 7).restore();
      y += 44;

      // ── NOTES ──────────────────────────────────────────────────────────────
      if (order.notes) {
        doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(8)
           .text('Notes: ' + order.notes, MARGIN, y, { width: COL_W }).restore();
        y += 20;
      }

      // ── FOOTER ─────────────────────────────────────────────────────────────
      const footerY = PAGE_H - 70;
      drawHRule(doc, footerY, BRAND_TAN);
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
         .text('This is a computer-generated invoice and does not require a signature.', MARGIN, footerY + 8, { align: 'center', width: COL_W }).restore();
      doc.save().fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
         .text('FabAroha · hello@fabaroha.in · fabaroha.com', MARGIN, footerY + 22, { align: 'center', width: COL_W }).restore();
      doc.save().fillColor(BRAND_BROWN).font('Helvetica-Bold').fontSize(8)
         .text('Thank you for shopping with FabAroha!', MARGIN, footerY + 38, { align: 'center', width: COL_W }).restore();

      // ── PAGE BORDER ────────────────────────────────────────────────────────
      doc.save().strokeColor(BRAND_TAN).lineWidth(1)
         .rect(10, 10, PAGE_W - 20, PAGE_H - 20).stroke().restore();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF, generateInvoiceNumber, gstBreakdown, buildGstSummary };
