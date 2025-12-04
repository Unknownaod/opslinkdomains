export const config = {
  runtime: "edge",
};

import dns from "dns/promises";

// Massive list of global TLDs
const TLD_LIST = [
  "com","net","org","io","gg","ai","xyz","co","me","tv","app","dev","tech","store","site",
  "us","ca","uk","au","de","fr","jp","cn","in","br","mx","es","it","ru","pl","se","no","fi","ch","nl","be",
  "cz","at","pt","tr","gr","za","nz","kr","hk","sg","id","ph","vn","th","my","sa","ae","eg","ng","ke","gh",
  "ar","cl","pe","uy","ve","co.za","co.uk","com.au","co.nz","com.br","com.mx","com.tr","com.ph",
  "bio","eco","earth","fun","music","movie","finance","capital","ventures","agency","law",
  "art","health","care","shop","travel","studio","design","systems","support","digital","press",
  "gov","edu","mil","int","info","biz","pro","mobi","name","jobs","tel","asia","cat","coop","museum"
];

async function checkDNS(domain) {
  try {
    await dns.resolve(domain);
    return "taken";
  } catch {
    return "available";
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing ?query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = query
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase();

  // Use limited concurrency to avoid DNS throttling
  const CONCURRENT = 20;
  const allResults = [];

  const chunks = [];
  for (let i = 0; i < TLD_LIST.length; i += CONCURRENT) {
    chunks.push(TLD_LIST.slice(i, i + CONCURRENT));
  }

  for (const batch of chunks) {
    const results = await Promise.allSettled(
      batch.map(async (tld) => {
        const domain = `${base}.${tld}`;
        const availability = await checkDNS(domain);
        return { domain, availability };
      })
    );
    allResults.push(...results.filter(r => r.status === "fulfilled").map(r => r.value));
  }

  return new Response(JSON.stringify({ query: base, results: allResults }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
