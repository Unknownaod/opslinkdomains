export const config = {
  runtime: "edge",
};

// ✅ Public domain availability API (WhoisXML or fallback)
export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Missing ?query parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.WHOISXML_KEY; // optional

  try {
    const term = query.trim().toLowerCase();

    // WHOISXML supports every TLD globally
    const endpoint = apiKey
      ? `https://domain-availability.whoisxmlapi.com/api/v1?apiKey=${apiKey}&domainName=${encodeURIComponent(
          term
        )}`
      : // fallback: open public DNS check (no key)
        `https://api.api-ninjas.com/v1/domainlookup?domain=${encodeURIComponent(term)}`;

    const headers = apiKey
      ? {}
      : { "X-Api-Key": process.env.API_NINJAS_KEY || "demo" };

    const resp = await fetch(endpoint, { headers });
    if (!resp.ok) {
      throw new Error(`Lookup failed (${resp.status})`);
    }

    const json = await resp.json();

    // Normalize output shape
    let results = [];

    if (json.domains && Array.isArray(json.domains)) {
      // API Ninjas response
      results = json.domains.map((d) => ({
        domain: d.domain,
        availability: d.available ? "available" : "taken",
      }));
    } else if (json.domainName) {
      // WhoisXML response
      results = [
        {
          domain: json.domainName,
          availability: json.domainAvailability === "AVAILABLE" ? "available" : "taken",
        },
      ];
    } else {
      results = [];
    }

    return new Response(
      JSON.stringify({ query: term, results }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (err) {
    console.error("checkDomain error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
