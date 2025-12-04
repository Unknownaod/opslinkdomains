export const config = {
  runtime: "edge",
};

const TLD_LIST = [
  "com","net","org","io","gg","ai","xyz","co","me","tv","app","dev","tech","store","site",
  "us","ca","uk","au","de","fr","jp","cn","in","br","mx","es","it","ru","pl","se","no","fi","ch","nl","be",
  "cz","at","pt","tr","gr","za","nz","kr","hk","sg","id","ph","vn","th","my","sa","ae","eg","ng","ke","gh",
  "ar","cl","pe","uy","ve","co.za","co.uk","com.au","co.nz","com.br","com.mx","com.tr","com.ph",
  "bio","eco","earth","fun","music","movie","finance","capital","ventures","agency","law",
  "art","health","care","shop","travel","studio","design","systems","support","digital","press"
];

// Helper to timeout a fetch after ms
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing ?query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = query.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0].toLowerCase();

  // Process in small batches to avoid Vercel Edge overload
  const BATCH_SIZE = 25;
  let allResults = [];

  for (let i = 0; i < TLD_LIST.length; i += BATCH_SIZE) {
    const batch = TLD_LIST.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (tld) => {
        const domain = `${base}.${tld}`;
        try {
          const res = await withTimeout(fetch(`https://${domain}`, { method: "HEAD" }), 1500);
          const available = res.status === 404 || res.status === 502 || res.status === 0;
          return { domain, availability: available ? "available" : "taken" };
        } catch {
          return { domain, availability: "available" };
        }
      })
    );

    allResults.push(...results.filter(r => r.status === "fulfilled").map(r => r.value));
  }

  return new Response(JSON.stringify({ query: base, results: allResults }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120, s-maxage=600",
    },
  });
}
