// ✅ Fastly-powered domain check API
// Place this file in /api/checkDomain.js in your Vercel project
// and add your FASTLY_API_KEY to the environment variables in Vercel.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing ?query parameter" });

  const fastlyKey = process.env.FASTLY_API_KEY;
  if (!fastlyKey)
    return res
      .status(500)
      .json({ error: "FASTLY_API_KEY missing in environment variables." });

  try {
    // Clean domain name input
    const cleanDomain = query.trim().toLowerCase();

    // 1️⃣ Check if the domain exists in Fastly's TLS domains list
    const domainRes = await fetch(
      `https://api.fastly.com/tls/domains?page[size]=1&filter[tls_domain.id]=${encodeURIComponent(
        cleanDomain
      )}`,
      {
        headers: {
          Accept: "application/json",
          "Fastly-Key": fastlyKey,
        },
      }
    );

    // Fastly API returns 404 if not found
    if (domainRes.status === 404)
      return res
        .status(200)
        .json({ domain: cleanDomain, available: true, message: "Domain not present in Fastly TLS registry" });

    const data = await domainRes.json();

    // If domain exists in Fastly
    if (data && data.data && data.data.length > 0) {
      const tlsInfo = data.data[0];
      return res.status(200).json({
        domain: tlsInfo.id,
        available: false,
        status: "registered",
        certificate_status: tlsInfo.attributes?.tls_configurations || "unknown",
      });
    }

    // 2️⃣ If not found, check if any TLS certs match this domain
    const certRes = await fetch("https://api.fastly.com/tls/certificates", {
      headers: {
        Accept: "application/json",
        "Fastly-Key": fastlyKey,
      },
    });

    const certData = await certRes.json();
    const matched = certData.data?.find((c) =>
      c.attributes.domains?.includes(cleanDomain)
    );

    if (matched) {
      return res.status(200).json({
        domain: cleanDomain,
        available: false,
        certificate_id: matched.id,
        certificate_status: matched.attributes.state,
      });
    }

    // 3️⃣ Otherwise assume available
    res.status(200).json({
      domain: cleanDomain,
      available: true,
      message: "Domain not found in Fastly TLS registry",
    });
  } catch (err) {
    console.error("Fastly API error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
}
