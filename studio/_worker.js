const VIDEO_SIZES = {"/clips/anime-constraints.mp4":1875779,"/clips/arri-alexa-65.mp4":1682914,"/clips/cinematic-study.mp4":1596965,"/clips/ecu-0000-0005.mp4":1876119,"/clips/hasselblad-h6d.mp4":1802528,"/clips/head-twist.mp4":1810363,"/clips/horror-tracking.mp4":1519147,"/clips/image-two-study.mp4":1788421,"/clips/master-sequence-i.mp4":1507495,"/clips/master-sequence-ii.mp4":1571825,"/clips/master-sequence-iii.mp4":1593464,"/clips/master-sequence-iv.mp4":1701505,"/clips/master-sequence-v.mp4":1725421,"/clips/master-sequence-vi.mp4":2024021,"/clips/master-sequence-vii.mp4":1570582,"/clips/master-sequence-viii.mp4":1501353,"/clips/paradox-2d-cite.mp4":1922036,"/clips/part-two.mp4":1784230,"/clips/reel-50.mp4":1688353,"/clips/reel-51.mp4":1647845,"/clips/reel-52.mp4":1743994,"/clips/reel-53.mp4":1551519,"/clips/reel-54.mp4":1800028,"/clips/reel-55.mp4":1550647,"/clips/reel-56.mp4":1550409,"/clips/reel-57.mp4":1837499,"/clips/reel-58.mp4":1793995,"/clips/reel-59.mp4":1671639,"/clips/reel-60.mp4":1537867,"/clips/reel-61.mp4":1721077,"/clips/reel-62.mp4":1741284,"/clips/reel-63.mp4":1746244,"/clips/reel-64.mp4":1810995,"/clips/reel-65.mp4":1724572,"/clips/reel-66.mp4":1608526,"/clips/reel-67.mp4":1482974,"/clips/reel-68.mp4":1869640,"/clips/reel-69.mp4":1748137,"/clips/reel-70.mp4":1672554,"/clips/reel-71.mp4":1578410,"/clips/reel-72.mp4":1581295,"/clips/reel-73.mp4":1739437,"/clips/reel-74.mp4":1672426,"/clips/reel-75.mp4":1549366,"/clips/reel-76.mp4":1671432,"/clips/reel-77.mp4":1687509,"/clips/reel-78.mp4":1716354,"/clips/reel-79.mp4":1741565,"/clips/reel-80.mp4":1589332,"/clips/reel-81.mp4":1767653,"/clips/reel-82.mp4":1559741,"/clips/reel-83.mp4":1610312,"/clips/resolution-study-i.mp4":1925276,"/clips/resolution-study-ii.mp4":1806924,"/clips/resolution-study-iii.mp4":1681472,"/clips/resolution-study-iv.mp4":1802694,"/clips/resolution-study-v.mp4":1840824,"/clips/ride-the-paradox-2d-i.mp4":2005851,"/clips/ride-the-paradox-2d-ii.mp4":1835310,"/clips/second-shot.mp4":1884321,"/clips/sequence-01.mp4":1688796,"/clips/sequence-02.mp4":1739862,"/clips/sequence-03.mp4":2027755,"/clips/sequence-04.mp4":1769267,"/clips/sequence-05.mp4":1786406,"/clips/sequence-06.mp4":1654250,"/clips/sequence-07.mp4":1708240,"/clips/sequence-08.mp4":1756073,"/clips/shot-0000-0004.mp4":1738572,"/clips/signal-chamber.mp4":12373770,"/clips/sixteen-k-i.mp4":1732919,"/clips/sixteen-k-ii.mp4":1740189,"/clips/sixteen-k-iii.mp4":1857550,"/clips/sleep-deprived-i.mp4":1865132,"/clips/sleep-deprived-ii.mp4":1950080,"/clips/sleep-deprived-iii.mp4":1787165,"/clips/storyboard-part-iii.mp4":1539353,"/clips/subject-3-desert.mp4":1902379,"/clips/subject-5.mp4":1927626,"/clips/subject-6-desert.mp4":1856616,"/clips/subject-7-90.mp4":1959569,"/clips/subject-7.mp4":1848042,"/clips/subject-8-desert-journey.mp4":23156880,"/clips/subject-8-desert.mp4":1861692,"/clips/subject-8-second-shot.mp4":9019281,"/clips/subject-87-6.mp4":1471227,"/clips/subject-9-88.mp4":1717619,"/clips/subject-90.mp4":1730967,"/clips/summicron-i.mp4":1714982,"/clips/summicron-ii.mp4":1787722,"/clips/summicron-iii.mp4":1610670,"/clips/tracking-sequence.mp4":1789367,"/clips/video-4k.mp4":1732567};
// Only /clips/* invokes this function. Other assets use Pages directly.
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

export default {
  async fetch(request, env) {
    const size = VIDEO_SIZES[new URL(request.url).pathname];
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
