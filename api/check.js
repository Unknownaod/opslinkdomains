export default async function handler(req, res) {
  const { domain } = req.query;

  if (!domain) return res.status(400).json({ error: "Missing domain name." });

  try {
    const apiUrl = `https://api.duoservers.com/domain/checkDomainAvailability?username=${process.env.RESELLER_USER}&password=${process.env.RESELLER_PASS}&domain=${domain}`;

    const response = await fetch(apiUrl);
    const text = await response.text();

    if (text.includes("AVAILABLE")) {
      res.status(200).json({ status: "available" });
    } else if (text.includes("TAKEN")) {
      res.status(200).json({ status: "taken" });
    } else {
      res.status(200).json({ status: "unknown", raw: text });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API request failed." });
  }
}
