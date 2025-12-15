/* =========================================================
   Dishanveshi Frontend – app.js
   Stable Production Version
   ========================================================= */

document.addEventListener("DOMContentLoaded", startApp);

function startApp() {
  /* ---------- CONFIG ---------- */
  const API_BASE = window.APP_CONFIG?.API_BASE;
  const MAPS_KEY = window.APP_CONFIG?.GOOGLE_MAPS_API_KEY;

  if (!API_BASE) {
    alert("API_BASE missing. Check frontend configuration.");
    console.error("APP_CONFIG missing API_BASE");
    return;
  }

  /* ---------- ELEMENTS ---------- */
  const loader = document.getElementById("loader");
  const auth = document.getElementById("auth");
  const app = document.getElementById("app");

  const authBtn = document.getElementById("authBtn");
  const switchAuth = document.getElementById("switchAuth");
  const authTitle = document.getElementById("authTitle");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const newItinBtn = document.getElementById("newItinBtn");
  const sendBtn = document.getElementById("sendBtn");
  const destInput = document.getElementById("destInput");
  const chatText = document.getElementById("chatText");

  const messages = document.getElementById("messages");

  /* ---------- STATE ---------- */
  let token = localStorage.getItem("token");
  let isLogin = true;
  let map = null;

  /* ---------- LOADER SAFE ---------- */
  function showLoader() {
    if (loader) loader.classList.remove("hidden");
  }

  function hideLoader() {
    if (loader) loader.classList.add("hidden");
  }

  /* ---------- VIEW CONTROL ---------- */
  function showApp() {
    auth.classList.add("hidden");
    app.classList.remove("hidden");
  }

  function showAuth() {
    auth.classList.remove("hidden");
    app.classList.add("hidden");
  }

  if (token) showApp();

  /* ---------- AUTH SWITCH ---------- */
  switchAuth.onclick = () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Login" : "Sign Up";
    authBtn.innerText = isLogin ? "Login" : "Sign Up";
    switchAuth.innerText = isLogin
      ? "No account? Sign up"
      : "Have account? Login";
  };

  /* ---------- LOGIN / SIGNUP ---------- */
  authBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    showLoader();

    try {
      if (isLogin) {
        /* OAuth2PasswordRequestForm → FORM DATA */
        const form = new FormData();
        form.append("username", email);
        form.append("password", password);

        const res = await fetch(API_BASE + "/api/auth/login", {
          method: "POST",
          body: form
        });

        if (!res.ok) throw new Error("Invalid login");

        const data = await res.json();
        token = data.access_token;
        localStorage.setItem("token", token);
        showApp();

      } else {
        /* SIGN UP */
        const res = await fetch(API_BASE + "/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) throw new Error("Signup failed");
        alert("Signup successful. Please login.");
        isLogin = true;
        switchAuth.onclick();
      }
    } catch (err) {
      alert("Authentication failed.");
      console.error("Auth error:", err);
    } finally {
      hideLoader();
    }
  };

  /* ---------- AUTH FETCH ---------- */
  async function api(path, options = {}) {
    showLoader();
    try {
      const res = await fetch(API_BASE + path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: token ? "Bearer " + token : "",
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      return await res.json();
    } finally {
      hideLoader();
    }
  }

  /* ---------- ITINERARY ---------- */
  if (newItinBtn) {
    newItinBtn.onclick = async () => {
      const destination = destInput.value || "Pune";
      try {
        const data = await api("/api/itinerary", {
          method: "POST",
          body: JSON.stringify({
            destination,
            days: 3,
            travel_type: "cultural",
            budget: "medium",
            mood: "relaxed",
            include_pois: true
          })
        });

        messages.innerHTML = "";
        data.plan.forEach(d => {
          const div = document.createElement("div");
          div.className = "card";
          div.innerText = `Day ${d.day}: ${d.summary}`;
          messages.appendChild(div);
        });
      } catch (e) {
        alert("Failed to generate itinerary");
        console.error(e);
      }
    };
  }

  /* ---------- AI CHAT ---------- */
  if (sendBtn) {
    sendBtn.onclick = async () => {
      const q = chatText.value.trim();
      if (!q) return;

      try {
        const r = await api("/api/ai/recommend", {
          method: "POST",
          body: JSON.stringify({ mood: "neutral", places_list: q })
        });

        const div = document.createElement("div");
        div.className = "card";
        div.innerText = r.recommendation;
        messages.prepend(div);
      } catch (e) {
        alert("AI request failed");
        console.error(e);
      }
    };
  }

  /* ---------- GOOGLE MAPS (SAFE LOAD) ---------- */
  if (MAPS_KEY) {
    const s = document.createElement("script");
    s.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      MAPS_KEY +
      "&callback=initMap";
    s.async = true;
    s.onerror = () => console.warn("Google Maps failed to load");
    document.head.appendChild(s);
  }

  window.initMap = function () {
    try {
      map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5
      });
    } catch {
      console.warn("Map init skipped");
    }
  };

  /* ---------- LOGOUT ---------- */
  window.logout = function () {
    localStorage.removeItem("token");
    location.reload();
  };
}
