/* ===============================
   Dishanveshi Frontend App
   Production-Ready app.js
================================ */

// ---------- CONFIG ----------
const CONFIG = window.APP_CONFIG || {};
const API_BASE = CONFIG.API_BASE;
const MAPS_KEY = CONFIG.GOOGLE_MAPS_API_KEY;

if (!API_BASE) {
  fatalUI("API_BASE missing. Check APP_CONFIG.");
}
if (!MAPS_KEY) {
  console.warn("⚠ Google Maps key missing — map disabled");
}

// ---------- GLOBAL STATE ----------
let map = null;
let markers = [];
let userToken = null;

// ---------- UTILS ----------
function log(...args) {
  console.log("[Dishanveshi]", ...args);
}

function errorUI(message) {
  addMessage(`❌ ${message}`, "ai");
}

function fatalUI(message) {
  document.body.innerHTML = `
    <div style="padding:40px;color:red;font-size:18px">
      <b>Fatal Error</b><br>${message}
    </div>`;
  throw new Error(message);
}

// ---------- SAFE FETCH ----------
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  log("API →", url);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${text}`);
    }

    return await res.json();
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    throw err;
  }
}

// ---------- UI ----------
function addMessage(text, who = "ai") {
  const box = document.createElement("div");
  box.className = "card";
  box.innerHTML = `
    <div style="font-weight:600">
      ${who === "user" ? "You" : "Dishanveshi"}
    </div>
    <div style="margin-top:6px">${text}</div>
  `;
  document.getElementById("messages").prepend(box);
}

// ---------- GOOGLE MAPS ----------
function initMap() {
  if (!MAPS_KEY) return;

  if (window.google?.maps) {
    onMapsReady();
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&callback=onMapsReady`;
  script.async = true;
  script.onerror = () => {
    document.getElementById("map").innerHTML =
      "❌ Failed to load Google Maps";
  };
  document.head.appendChild(script);
}

window.onMapsReady = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5
  });
};

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}

// ---------- ITINERARY ----------
async function generateItinerary(destination) {
  addMessage(`Generating itinerary for ${destination}…`, "user");

  try {
    const data = await apiFetch("/api/itinerary", {
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

    if (!Array.isArray(data.plan)) {
      throw new Error("Invalid itinerary response");
    }

    renderPlan(data.plan);
  } catch (err) {
    errorUI("Itinerary error: " + err.message);
  }
}

function renderPlan(plan) {
  clearMarkers();
  const container = document.getElementById("messages");
  container.innerHTML = "";

  plan.forEach(day => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<b>Day ${day.day}</b><br>${day.summary || ""}`;
    container.appendChild(card);

    (day.places || []).forEach(p => {
      if (map && p.lat && p.lng) {
        const lat = Number(p.lat);
        const lng = Number(p.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          markers.push(
            new google.maps.Marker({
              position: { lat, lng },
              map,
              title: p.name || "Place"
            })
          );
        }
      }
    });
  });
}

// ---------- AI CHAT ----------
async function askAI(text) {
  addMessage(text, "user");

  try {
    const data = await apiFetch("/api/ai/recommend", {
      method: "POST",
      body: JSON.stringify({
        mood: "neutral",
        places_list: text
      })
    });

    addMessage(data.recommendation || "No response");
  } catch (err) {
    errorUI("AI error: " + err.message);
  }
}

// ---------- LOGIN ----------
async function login() {
  const email = prompt("Email");
  const password = prompt("Password");
  if (!email || !password) return;

  const form = new FormData();
  form.append("username", email);
  form.append("password", password);

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: form
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    userToken = data.access_token;

    addMessage(`Logged in as ${email}`, "ai");
    loadSaved();
  } catch (err) {
    errorUI("Login error");
  }
}

// ---------- SAVED ----------
async function loadSaved() {
  const panel = document.getElementById("savedList");
  panel.innerHTML = "";

  try {
    const data = await apiFetch("/api/itinerary/my");
    data.forEach(it => {
      const d = document.createElement("div");
      d.className = "card";
      d.textContent = it.destination;
      panel.appendChild(d);
    });
  } catch {
    panel.innerHTML = "⚠ Failed to load saved itineraries";
  }
}

// ---------- EVENTS ----------
document.getElementById("sendBtn").onclick = () =>
  askAI(document.getElementById("chatText").value.trim());

document.getElementById("newItinBtn").onclick = () =>
  generateItinerary(
    document.getElementById("destInput").value.trim() || "Pune"
  );

document.getElementById("loginBtn").onclick = login;

// ---------- START ----------
log("App started");
initMap();
