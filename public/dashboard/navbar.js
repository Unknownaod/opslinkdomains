document.write(`
<nav class="nav">
  <div class="brand">
    <div class="logo-mark">OD</div>
    OpsLink Domains
  </div>
  <div class="nav-links">
    <a href="/dashboard/index.html">Overview</a>
    <a href="/dashboard/domains.html">My Domains</a>
    <a href="/dashboard/dns.html">DNS</a>
    <a href="/dashboard/billing.html">Billing</a>
    <button id="logoutBtn">Logout</button>
  </div>
</nav>
<style>
  nav.nav {
    background: rgba(10,15,26,0.8);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(148,163,184,0.3);
    padding: 16px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brand { display: flex; align-items:center; gap: 10px; font-weight:700; }
  .logo-mark {
    width:32px; height:32px; border-radius:10px;
    background: linear-gradient(135deg,#4e8cff,#2563eb);
    display:flex; justify-content:center; align-items:center;
    color:#fff; font-weight:800; font-size:14px;
  }
  .nav-links a, #logoutBtn {
    margin-left: 22px; color:#dbeafe; font-size:14px;
    text-decoration:none; transition:0.25s;
  }
  .nav-links a:hover { color:#93c5fd; }
  #logoutBtn {
    background:none; border:none; cursor:pointer; color:#ef4444;
  }
</style>
<script>
  document.getElementById("logoutBtn").onclick = function() {
    localStorage.removeItem("token");
    window.location.href = "/auth/login.html";
  };
</script>
`);
