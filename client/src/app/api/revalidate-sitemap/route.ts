// client/src/app/api/revalidate-sitemap/route.ts
// On-demand ISR revalidation endpoint — called by the server cron job daily.
// Requires ?secret=<REVALIDATE_SECRET> to prevent unauthorized cache purges.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid or missing secret' }, { status: 401 });
  }

  try {
    revalidatePath('/sitemap.xml');
    revalidatePath('/google-shopping-feed.xml');

    return NextResponse.json({
      revalidated: true,
      paths: ['/sitemap.xml', '/google-shopping-feed.xml'],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[revalidate-sitemap]', err);
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
  }
}
