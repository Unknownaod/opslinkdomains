export default async function handler(req, res) {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({ error: "Missing domain parameter" });
  }

  // Build the ResellersPanel API call
  const apiUrl = `https://api.duoservers.com/domain/checkDomainAvailability?username=${process.env.RESELLER_USER}&password=${process.env.RESELLER_PASS}&domain=${domain}`;

  try {
    const response = await fetch(apiUrl);
    const text = await response.text(); // Their API returns plain text or XML depending on method

    res.status(200).send(text);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API request failed" });
  }
}
