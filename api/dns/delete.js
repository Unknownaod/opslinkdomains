export async function POST(req) {
  const { domain, record_id } = await req.json();

  const url =
    `https://www.namesilo.com/api/dnsDeleteRecord?version=1&type=json
     &key=${process.env.NAMESILO_KEY}
     &domain=${domain}&record_id=${record_id}`;

  const res = await fetch(url).then(r => r.json());
  return NextResponse.json(res);
}
