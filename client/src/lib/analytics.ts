// client/src/lib/analytics.ts
// Fire-and-forget event tracker — never blocks the UI, never throws to the caller.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getSessionId(): string {
  try {
    let sid = localStorage.getItem('fab-session-id');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('fab-session-id', sid);
    }
    return sid;
  } catch {
    return 'unknown';
  }
}

interface EventPayload {
  event:        string;
  sessionId:    string;
  productId?:   string;
  productSlug?: string;
  productTitle?:string;
  productImage?:string;
  price?:       number;
  quantity?:    number;
}

function track(payload: Omit<EventPayload, 'sessionId'>) {
  if (typeof window === 'undefined') return; // skip SSR
  try {
    const sessionId = getSessionId();
    fetch(`${API_URL}/analytics/event`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...payload, sessionId }),
      // keepalive so the request completes even if the user navigates away
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Swallow — analytics must never affect UX
  }
}

export const analytics = {
  productView(product: { _id: string; slug: string; title: string; images?: string[]; discountedPrice?: number; price?: number }) {
    track({
      event:        'product_view',
      productId:    product._id,
      productSlug:  product.slug,
      productTitle: product.title,
      productImage: product.images?.[0],
      price:        product.discountedPrice ?? product.price,
    });
  },

  addToCart(product: { _id: string; slug: string; title: string; image?: string; discountedPrice?: number; price?: number }, quantity = 1) {
    track({
      event:        'add_to_cart',
      productId:    product._id,
      productSlug:  product.slug,
      productTitle: product.title,
      productImage: product.image,
      price:        product.discountedPrice ?? product.price,
      quantity,
    });
  },

  wishlistAdd(product: { _id: string; slug: string; title?: string; images?: string[] }) {
    track({
      event:        'wishlist_add',
      productId:    product._id,
      productSlug:  product.slug,
      productTitle: product.title,
      productImage: product.images?.[0],
    });
  },
};
