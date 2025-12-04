export const config = {
  runtime: "edge", // works perfectly on Vercel Edge
};

// ✅ Global Domain Availability Search (Vercel-style)
export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Missing ?query parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const search = query.trim().toLowerCase();

    // Use Domainr’s API (served by Fastly)
    const apiKey = process.env.DOMAINR_KEY || "";
    const endpoint = `https://api.domainr.com/v2/search?query=${encodeURIComponent(
      search
    )}${apiKey ? `&key=${apiKey}` : ""}`;

    const resp = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }, // 1-minute edge cache
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Domainr Error:", text);
      throw new Error(`Domainr API ${resp.status}: ${text.slice(0, 120)}`);
    }

    const json = await resp.json();

    // Defensive check — handle malformed payloads
    if (!json.results || !Array.isArray(json.results)) {
      console.error("Bad Domainr response:", json);
      return new Response(
        JSON.stringify({
          query: search,
          results: [],
          message: "Empty or invalid response from Domainr API.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format for frontend
    const results = json.results.map((r) => ({
      domain: r.domain,
      availability: r.availability || "unknown",
      registerURL: `https://domains.opslinkcad.com/cart.php?a=add&domain=register&query=${encodeURIComponent(
        r.domain
      )}`,
    }));

    return new Response(
      JSON.stringify({ query: search, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("checkDomain.js error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
