<!DOCTYPE html>
<html>
<head>
  <title>My Domains — OpsLink Domains</title>
  <style>
    body { background:#050810; color:white; font-family: Segoe UI; margin:0; }
    .container { max-width:1100px; margin:auto; padding:40px; }
    .domain-item {
      padding:16px; border-bottom:1px solid rgba(148,163,184,.3);
      display:flex; justify-content:space-between; align-items:center;
    }
    .renew-btn { background:#2563eb; border:none; padding:8px 14px; border-radius:10px; cursor:pointer; }
  </style>
</head>
<body>
<script src="/dashboard/navbar.js"></script>

<div class="container">
  <h1>My Domains</h1>
  <div id="domainList"></div>
</div>

<script>
if (!localStorage.getItem("token")) window.location="/auth/login.html";

async function loadDomains() {
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: localStorage.getItem("token") }
  });
  const data = await res.json();

  document.getElementById("domainList").innerHTML = data.domains.map(d =>
    `<div class="domain-item">
      ${d}
      <button class="renew-btn">Renew</button>
    </div>`
  ).join("");
}
loadDomains();
</script>
</body>
</html>
