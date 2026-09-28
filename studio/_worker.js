const VIDEO_SIZES = {"/clips/anime-constraints.mp4":1875779,"/clips/arri-alexa-65.mp4":1682914,"/clips/cinematic-study.mp4":1596965,"/clips/ecu-0000-0005.mp4":1876119,"/clips/hasselblad-h6d.mp4":1802528,"/clips/head-twist.mp4":1810363,"/clips/horror-tracking.mp4":1519147,"/clips/image-two-study.mp4":1788421,"/clips/master-sequence-i.mp4":1507495,"/clips/master-sequence-ii.mp4":1571825,"/clips/master-sequence-iii.mp4":1593464,"/clips/master-sequence-iv.mp4":1701505,"/clips/master-sequence-v.mp4":1725421,"/clips/master-sequence-vi.mp4":2024021,"/clips/master-sequence-vii.mp4":1570582,"/clips/master-sequence-viii.mp4":1501353,"/clips/paradox-2d-cite.mp4":1922036,"/clips/part-two.mp4":1784230,"/clips/reel-50.mp4":1688353,"/clips/reel-51.mp4":1647845,"/clips/reel-52.mp4":1743994,"/clips/reel-53.mp4":1551519,"/clips/reel-54.mp4":1800028,"/clips/reel-55.mp4":1550647,"/clips/reel-56.mp4":1550409,"/clips/reel-57.mp4":1837499,"/clips/reel-58.mp4":1793995,"/clips/reel-59.mp4":1671639,"/clips/reel-60.mp4":1537867,"/clips/reel-61.mp4":1721077,"/clips/reel-62.mp4":1741284,"/clips/reel-63.mp4":1746244,"/clips/reel-64.mp4":1810995,"/clips/reel-65.mp4":1724572,"/clips/reel-66.mp4":1608526,"/clips/reel-67.mp4":1482974,"/clips/reel-68.mp4":1869640,"/clips/reel-69.mp4":1748137,"/clips/reel-70.mp4":1672554,"/clips/reel-71.mp4":1578410,"/clips/reel-72.mp4":1581295,"/clips/reel-73.mp4":1739437,"/clips/reel-74.mp4":1672426,"/clips/reel-75.mp4":1549366,"/clips/reel-76.mp4":1671432,"/clips/reel-77.mp4":1687509,"/clips/reel-78.mp4":1716354,"/clips/reel-79.mp4":1741565,"/clips/reel-80.mp4":1589332,"/clips/reel-81.mp4":1767653,"/clips/reel-82.mp4":1559741,"/clips/reel-83.mp4":1610312,"/clips/resolution-study-i.mp4":1925276,"/clips/resolution-study-ii.mp4":1806924,"/clips/resolution-study-iii.mp4":1681472,"/clips/resolution-study-iv.mp4":1802694,"/clips/resolution-study-v.mp4":1840824,"/clips/ride-the-paradox-2d-i.mp4":2005851,"/clips/ride-the-paradox-2d-ii.mp4":1835310,"/clips/second-shot.mp4":1884321,"/clips/sequence-01.mp4":1688796,"/clips/sequence-02.mp4":1739862,"/clips/sequence-03.mp4":2027755,"/clips/sequence-04.mp4":1769267,"/clips/sequence-05.mp4":1786406,"/clips/sequence-06.mp4":1654250,"/clips/sequence-07.mp4":1708240,"/clips/sequence-08.mp4":1756073,"/clips/shot-0000-0004.mp4":1738572,"/clips/signal-chamber.mp4":12373770,"/clips/sixteen-k-i.mp4":1732919,"/clips/sixteen-k-ii.mp4":1740189,"/clips/sixteen-k-iii.mp4":1857550,"/clips/sleep-deprived-i.mp4":1865132,"/clips/sleep-deprived-ii.mp4":1950080,"/clips/sleep-deprived-iii.mp4":1787165,"/clips/storyboard-part-iii.mp4":1539353,"/clips/subject-3-desert.mp4":1902379,"/clips/subject-5.mp4":1927626,"/clips/subject-6-desert.mp4":1856616,"/clips/subject-7-90.mp4":1959569,"/clips/subject-7.mp4":1848042,"/clips/subject-8-desert-journey.mp4":23156880,"/clips/subject-8-desert.mp4":1861692,"/clips/subject-8-pink-salt-cathedral.mp4":6450772,"/clips/subject-8-second-shot.mp4":9019281,"/clips/subject-87-6.mp4":1471227,"/clips/subject-9-88.mp4":1717619,"/clips/subject-90.mp4":1730967,"/clips/summicron-i.mp4":1714982,"/clips/summicron-ii.mp4":1787722,"/clips/summicron-iii.mp4":1610670,"/clips/tracking-sequence.mp4":1789367,"/clips/video-4k.mp4":1732567};
// Only /clips/* and /reset/* invoke this function (see _routes.json). Other assets use Pages directly.
// VIDEO_SIZES is generated from the reviewed files at publication time.
function requestedRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value || '');
  if (!match || (!match[1] && !match[2])) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) return false;
  if (first === null) return last > 0 ? [Math.max(0, size - last), size - 1] : false;
  if (first >= size || (last !== null && last < first)) return false;
  return [first, Math.min(size - 1, last === null ? size - 1 : last)];
}

function sliceStream(body, start, end) {
  const reader = body.getReader();
  let offset = 0;
  return new ReadableStream({
    async pull(controller) {
      try {
        for (;;) {
          const {done, value} = await reader.read();
          if (done) { controller.close(); return; }
          const before = offset;
          offset += value.byteLength;
          if (offset <= start) continue;
          const from = Math.max(0, start - before);
          const to = Math.min(value.byteLength, end + 1 - before);
          if (to > from) controller.enqueue(value.subarray(from, to));
          if (offset > end) { controller.close(); await reader.cancel(); }
          return;
        }
      } catch (error) { controller.error(error); }
    },
    cancel(reason) { return reader.cancel(reason); }
  });
}

// ---------------------------------------------------------------- The Subject 8 Reset (paid download)
// Stripe Payment Link -> redirects to /reset/download/?session_id=... . The session is checked against the
// Stripe API with a restricted key (env.STRIPE_RESTRICTED_KEY, set in Cloudflare Pages settings - read-only
// "Checkout Sessions"), and only a paid session for this product gets the file. The repo is public, so only an
// ENCRYPTED copy sits under /reset/_f/ (never served directly); it is decrypted here with env.RESET_FILE_KEY.
const RESET_FILE = '/reset/_f/n03esvdaz7ugctpirblwy825.bin';   // AES-256-GCM: 12-byte IV + ciphertext; key = env.RESET_FILE_KEY (base64)
const RESET_SKU = 'S8-RESET-01';
const RESET_NAME = 'THE-SUBJECT-8-RESET.pdf';

async function paidSession(id, env) {
  if (!id || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(id) || !env.STRIPE_RESTRICTED_KEY) return null;
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + id, {
    headers: {Authorization: 'Bearer ' + env.STRIPE_RESTRICTED_KEY}
  });
  if (!r.ok) return null;
  const s = await r.json();
  return s.payment_status === 'paid' && (s.metadata || {}).sku === RESET_SKU ? s : null;
}

async function resetPdf(env, url) {
  if (!env.RESET_FILE_KEY) return null;
  const asset = await env.ASSETS.fetch(new Request(new URL(RESET_FILE, url.origin)));
  if (asset.status !== 200) return null;
  const blob = new Uint8Array(await asset.arrayBuffer());
  const raw = Uint8Array.from(atob(env.RESET_FILE_KEY.trim()), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  try { return await crypto.subtle.decrypt({name: 'AES-GCM', iv: blob.slice(0, 12)}, key, blob.slice(12)); }
  catch (e) { return null; }
}

function resetPage(title, body, status) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | PARADOX</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1012;color:#e8f1f2;font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:24px;box-sizing:border-box}
.box{max-width:560px;text-align:center}.eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#9eb7ba}
h1{font-size:clamp(30px,6vw,46px);letter-spacing:-.04em;margin:18px 0}p{color:#aebdbd;line-height:1.7}
.btn{display:inline-block;margin-top:20px;border:1px solid #c6dfe2;color:#fff;padding:14px 30px;letter-spacing:.18em;text-transform:uppercase;font-size:12px;text-decoration:none}
.btn:hover{background:#c6dfe2;color:#0b1012}a{color:#c6dfe2}</style></head><body><div class="box">${body}</div></body></html>`;
  return new Response(html, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'}});
}

async function handleReset(request, env, url) {
  if (url.pathname.startsWith('/reset/_f/')) return new Response('Not found', {status: 404});
  const id = url.searchParams.get('session_id');
  if (url.pathname === '/reset/file') {
    if (!(await paidSession(id, env))) return new Response('Payment not found', {status: 403});
    const pdf = await resetPdf(env, url);
    if (!pdf) return new Response('Download temporarily unavailable - email ridetheparadox@gmail.com', {status: 503});
    return new Response(pdf, {status: 200, headers: {'Content-Type': 'application/pdf', 'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${RESET_NAME}"`}});
  }
  if (url.pathname === '/reset/download' || url.pathname === '/reset/download/') {
    if (await paidSession(id, env)) {
      return resetPage('Your download', `<div class="eyebrow">Thank you / Payment received</div><h1>The Subject 8 Reset</h1>
<p>Your 7-Day Breathing &amp; Calm Workbook is ready. It is a fillable PDF: open it in Adobe Acrobat Reader (free), the Files app on iPhone or iPad, or any PDF app to type and tap on every page.</p>
<a class="btn" href="/reset/file?session_id=${encodeURIComponent(id)}">Download the workbook</a>
<p style="margin-top:28px;font-size:13px">Keep this page to download again. Trouble downloading? Email <a href="mailto:ridetheparadox@gmail.com">ridetheparadox@gmail.com</a> with your receipt.</p>`, 200);
    }
    return resetPage('Download', `<div class="eyebrow">The Subject 8 Reset</div><h1>We could not confirm this payment.</h1>
<p>If you just paid, wait a few seconds and refresh. Still stuck? Email <a href="mailto:ridetheparadox@gmail.com">ridetheparadox@gmail.com</a> with your receipt and we will send your workbook.</p>`, 403);
  }
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/reset/')) return handleReset(request, env, url);
    const size = VIDEO_SIZES[url.pathname];
    if (!size || !['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);
    const assetRequest = new Request(request);
    assetRequest.headers.delete('Range');
    assetRequest.headers.delete('If-Range');
    const asset = await env.ASSETS.fetch(assetRequest);
    if (asset.status !== 200 || !(asset.headers.get('Content-Type') || '').startsWith('video/')) return asset;
    const headers = new Headers(asset.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(size));
    if (request.method === 'HEAD') return new Response(null, {status: 200, headers});
    const ifRange = request.headers.get('If-Range');
    const range = ifRange && ifRange !== asset.headers.get('ETag') ? null : requestedRange(request.headers.get('Range'), size);
    if (range === null) return new Response(asset.body, {status: 200, headers});
    if (range === false) {
      await asset.body.cancel();
      headers.set('Content-Range', `bytes */${size}`);
      headers.set('Content-Length', '0');
      return new Response(null, {status: 416, headers});
    }
    const [start, end] = range;
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(sliceStream(asset.body, start, end), {status: 206, headers});
  }
};
