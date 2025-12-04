export async function POST(req) {
  const body = await req.json();
  const { domain, type, host, value, ttl = 3600 } = body;

  const url =
    `https://www.namesilo.com/api/dnsAddRecord?version=1&type=json
     &key=${process.env.NAMESILO_KEY}
     &domain=${domain}&rrtype=${type}&rrhost=${host}&rrvalue=${value}&rrttl=${ttl}`;

  const res = await fetch(url).then(r => r.json());
  return NextResponse.json(res);
}
