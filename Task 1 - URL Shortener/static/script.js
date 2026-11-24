/* ─────────────────────────────────────────────
   SnapLink – script.js
   ───────────────────────────────────────────── */

(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const urlInput     = document.getElementById("urlInput");
  const shortenBtn   = document.getElementById("shortenBtn");
  const btnText      = shortenBtn?.querySelector(".btn-text");
  const btnSpinner   = shortenBtn?.querySelector(".btn-spinner");
  const messageEl    = document.getElementById("message");
  const resultCard   = document.getElementById("resultCard");
  const shortUrlLink = document.getElementById("shortUrlLink");
  const originalText = document.getElementById("originalUrlText");
  const copyBtn      = document.getElementById("copyBtn");
  const copyLabel    = document.getElementById("copyLabel");

  // Guard – 404 page has no form
  if (!shortenBtn) return;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function showMessage(text, type /* "success" | "error" */) {
    messageEl.textContent = text;
    messageEl.className = "message " + type;
    messageEl.hidden = false;
  }

  function hideMessage() {
    messageEl.hidden = true;
    messageEl.className = "message";
  }

  function setLoading(on) {
    shortenBtn.disabled = on;
    btnText.hidden      = on;
    btnSpinner.hidden   = !on;
  }

  function showResult(shortUrl, originalUrl) {
    shortUrlLink.href        = shortUrl;
    shortUrlLink.textContent = shortUrl;
    originalText.textContent = originalUrl;
    resultCard.hidden        = false;
  }

  function hideResult() {
    resultCard.hidden = true;
  }

  // ── Shorten ───────────────────────────────────────────────────────────────

  async function handleShorten() {
    const rawUrl = urlInput.value.trim();

    // Basic client-side check before hitting the server
    if (!rawUrl) {
      showMessage("⚠️ Please enter a URL.", "error");
      urlInput.focus();
      return;
    }

    // Auto-prepend https:// if the user forgot the scheme
    let urlToSend = rawUrl;
    if (!/^https?:\/\//i.test(urlToSend)) {
      urlToSend = "https://" + urlToSend;
    }

    hideMessage();
    hideResult();
    setLoading(true);

    try {
      const response = await fetch("/shorten", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: urlToSend }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage("❌ " + (data.error || "Something went wrong. Please try again."), "error");
        return;
      }

      showMessage("✅ Short URL created successfully!", "success");
      showResult(data.short_url, urlToSend);
      urlInput.value = "";
    } catch (err) {
      showMessage("❌ Network error – make sure the server is running.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Copy ──────────────────────────────────────────────────────────────────

  async function handleCopy() {
    const url = shortUrlLink.textContent;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    // Visual feedback
    copyBtn.classList.add("copied");
    copyLabel.textContent = "Copied!";
    copyBtn.querySelector("svg").innerHTML =
      '<polyline points="20 6 9 17 4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyLabel.textContent = "Copy";
      copyBtn.querySelector("svg").innerHTML = `
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`;
    }, 2500);
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  shortenBtn.addEventListener("click", handleShorten);
  copyBtn?.addEventListener("click", handleCopy);

  // Allow pressing Enter in the input
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleShorten();
  });

  // Clear error while user is typing
  urlInput.addEventListener("input", () => {
    if (!messageEl.hidden && messageEl.classList.contains("error")) hideMessage();
  });
})();
