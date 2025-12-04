export const config = {
  runtime: "edge",
};

/**
 * OpsLink Domains - Global TLD Availability Checker
 * Full 100+ TLD list, safe parallel requests, and zero dependencies.
 */
export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Missing ?query parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Normalize base name (strip protocol and www)
  const base = query
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase();

  // 🌎 Major + Country TLDs (100+)
  const tlds = [
    // Generic
    "com", "net", "org", "info", "biz", "xyz", "site", "online", "store",
    "app", "dev", "tech", "cloud", "io", "gg", "ai", "co", "me", "tv", "cc",
    "space", "world", "today", "live", "group", "link", "club", "pro", "fun",
    "works", "tools", "solutions", "studio", "design", "systems", "support",
    "services", "agency", "center", "network", "digital", "expert", "media",
    "finance", "software", "press", "news", "blog", "global", "shop", "love",

    // Countries
    "us", "ca", "uk", "au", "de", "fr", "jp", "cn", "in", "br", "mx", "es",
    "it", "ru", "pl", "se", "no", "dk", "fi", "ch", "nl", "be", "cz", "at",
    "pt", "tr", "gr", "za", "nz", "kr", "hk", "sg", "id", "ph", "vn", "th",
    "my", "sa", "ae", "eg", "ng", "ke", "gh", "ar", "cl", "pe", "uy", "ve",
    "co.za", "co.uk", "com.au", "co.nz", "com.br", "com.mx", "com.tr", "com.ph",

    // Trending/new
    "bio", "dev", "eco", "earth", "lol", "fun", "music", "movie", "tech",
    "games", "game", "finance", "capital", "ventures", "agency", "law", "art",
    "health", "care", "shop", "travel", "studio", "photography", "money"
  ];

  try {
    // Run parallel checks (HEAD requests)
    const results = await Promise.allSettled(
      tlds.map(async (tld) => {
        const domain = `${base}.${tld}`;
        const url = `https://${domain}`;
        try {
          const res = await fetch(url, { method: "HEAD" });
          const available = res.status === 404 || res.status === 502 || res.status === 0;
          return { domain, availability: available ? "available" : "taken" };
        } catch {
          // Network/SSL error — assume available
          return { domain, availability: "available" };
        }
      })
    );

    const cleaned = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    return new Response(JSON.stringify({ query: base, results: cleaned }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("Domain lookup error:", err);
    return new Response(
      JSON.stringify({
        error: "Lookup failed",
        details: err.message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
