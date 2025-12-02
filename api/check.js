export default async function handler(req, res) {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Missing domain" });

  const username = process.env.RESELLER_USER;
  const password = process.env.RESELLER_PASS;

  const url = `https://api.duoservers.com/domain/checkDomainAvailability?username=${username}&password=${password}&domain=${domain}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    const clean = text.toLowerCase().trim();

    let status = "unknown";
    if (clean.includes("available")) status = "available";
    else if (clean.includes("taken") || clean.includes("registered")) status = "taken";
    else if (clean.includes("<status>available</status>")) status = "available";
    else if (clean.includes("<status>taken</status>")) status = "taken";

    res.status(200).json({ status, raw: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API request failed" });
  }
}
