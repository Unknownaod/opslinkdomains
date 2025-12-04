export const config = {
  runtime: "nodejs",
};

/**
 * OpsLink Domains - Global TLD Availability Checker
 * Node runtime version using HTTPS checks (works on Vercel)
 */

const TLD_LIST = [
  "com","net","org","io","gg","ai","xyz","co","me","tv","app","dev","tech","store","site",
  "us","ca","uk","au","de","fr","jp","cn","in","br","mx","es","it","ru","pl","se","no","fi","ch","nl","be",
  "cz","at","pt","tr","gr","za","nz","kr","hk","sg","id","ph","vn","th","my","sa","ae","eg","ng","ke","gh",
  "ar","cl","pe","uy","ve","co.za","co.uk","com.au","co.nz","com.br","com.mx","com.tr","com.ph",
  "bio","eco","earth","fun","music","movie","finance","capital","ventures","agency","law",
  "art","health","care","shop","travel","studio","design","systems","support","digital","press",
  "gov","edu","mil","info","biz","pro","mobi","name","jobs","tel","asia","cat","coop","museum"
];

// Helper to quickly test if a domain resolves or not
async function isDomainAvailable(domain) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    // If we get a valid HTTP response, assume taken
    return res.status === 404 || res.status === 502 ? "available" : "taken";
  } catch {
    // Network or SSL error = likely available
    return "available";
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const query = url.searchParams.get("query");

  if (!query) {
    res.status(400).json({ error: "Missing ?query parameter" });
    return;
  }

  const base = query
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase();

  const BATCH_SIZE = 20;
  let results = [];

  for (let i = 0; i < TLD_LIST.length; i += BATCH_SIZE) {
    const batch = TLD_LIST.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (tld) => {
        const domain = `${base}.${tld}`;
        const availability = await isDomainAvailable(domain);
        return { domain, availability };
      })
    );
    results = results.concat(batchResults);
  }

  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
  res.status(200).json({ query: base, results });
}
