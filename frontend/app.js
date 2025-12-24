document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = window.APP_CONFIG.API_BASE;
  const MAPS_KEY = window.APP_CONFIG.GOOGLE_MAPS_API_KEY;

  const loader = document.getElementById("loader");
  const mapStatus = document.getElementById("mapStatus");

  const authBtn = document.getElementById("authBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const newItinBtn = document.getElementById("newItinBtn");
  const destInput = document.getElementById("destInput");
  const messages = document.getElementById("messages");

  const sendBtn = document.getElementById("sendBtn");
  const chatText = document.getElementById("chatText");

  let token = localStorage.getItem("token");

  function showLoader() {
    if (loader) loader.classList.remove("hidden");
  }

  function hideLoader() {
    if (loader) loader.classList.add("hidden");
  }

  /* 🔥 VERY IMPORTANT */
  hideLoader(); // never block UI on load

  /* ---------------- LOGIN ---------------- */
  authBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    showLoader();
    try {
      const res = await fetch(API_BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      token = data.access_token;
      localStorage.setItem("token", token);
      alert("Login successful");
    } catch {
      alert("Login failed");
    } finally {
      hideLoader();
    }
  };

  /* ---------------- ITINERARY ---------------- */
  newItinBtn.onclick = async () => {
    if (!token) {
      alert("Please login first");
      return;
    }

    showLoader();
    try {
      const res = await fetch(API_BASE + "/api/itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          destination: destInput.value || "Pune",
          days: 3
        })
      });

      const data = await res.json();
      messages.innerHTML = "";

      (data.plan || []).forEach(d => {
        const div = document.createElement("div");
        div.className = "card";
        div.textContent = `Day ${d.day}: ${d.summary}`;
        messages.appendChild(div);
      });
    } catch {
      alert("Itinerary failed");
    } finally {
      hideLoader();
    }
  };

  /* ---------------- AI ---------------- */
  sendBtn.onclick = async () => {
    if (!token) {
      alert("Please login first");
      return;
    }

    showLoader();
    try {
      const res = await fetch(API_BASE + "/api/ai/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ places_list: chatText.value })
      });

      const data = await res.json();
      alert(data.recommendation);
    } catch {
      alert("AI failed");
    } finally {
      hideLoader();
    }
  };

  /* ---------------- GOOGLE MAPS ---------------- */
  if (MAPS_KEY) {
    const script = document.createElement("script");
