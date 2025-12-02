export default async function handler(req, res) {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Missing domain" });

  const username = process.env.RESELLER_USER; // store244290
  const password = process.env.RESELLER_PASS; // your password

  const url = `https://api.duoservers.com/domain/checkDomainAvailability?username=${username}&password=${password}&domain=${domain}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    let status = "unknown";
    if (text.toLowerCase().includes("available")) status = "available";
    else if (text.toLowerCase().includes("taken")) status = "taken";

    res.status(200).json({ status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "API request failed" });
  }
}
