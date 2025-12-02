export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  if (!domain) {
    return new Response(JSON.stringify({ error: "Missing domain" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const username = process.env.RESELLER_USER;
  const password = process.env.RESELLER_PASS;

  const apiURL = `https://api.duoservers.com/domain/checkDomainAvailability?username=${username}&password=${password}&domain=${domain}`;

  try {
    const resp = await fetch(apiURL, {
      cache: "no-store",
      headers: { "User-Agent": "OpsLinkDomainsChecker/1.0" },
    });
    const text = await resp.text();

    // Debug log
    console.log("ResellersPanel raw response:", text);

    const clean = text.toLowerCase();
    let status = "unknown";
    if (clean.includes("available")) status = "available";
    else if (clean.includes("taken") || clean.includes("registered")) status = "taken";
    else if (clean.includes("<status>available</status>")) status = "available";
    else if (clean.includes("<status>taken</status>")) status = "taken";

    return new Response(
      JSON.stringify({ status, raw: text }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("API Error:", err);
    return new Response(
      JSON.stringify({ error: "API request failed", detail: err.message }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
