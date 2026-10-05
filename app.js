/**
 * DRE Enterprise Hackathon '26 - Main Application Logic
 * Art-directed editorial system with visual chapters, consulting report table,
 * exact problem statements, and clean event registration.
 */

// ============================================================
// 0. BACKEND CONFIGURATION — Google Apps Script + Google Sheets
// (free, unlimited — replaced Supabase)
//
// SETUP: see DRIVE-BACKEND-SETUP.md in the project root.
// Paste your Apps Script Web App URL below (ends in /exec):
// ============================================================
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyOE8E3IQK4kbbZ7yiFszgtdK2nXBxTan4tAwOHUl7BmvoAH7uH0Lm7NyRkGPYK1HJpMA/exec";

const backendReady = true;

// Push a registration record to the Google Sheet via Apps Script.
// Uses form-encoded POST so no CORS preflight problems occur.
async function saveRegistrationToBackend(data) {
  if (!backendReady) return false;
  try {
    const body = new URLSearchParams({
      reg_id: data.regId,
      team_name: data.teamName,
      team_lead: data.teamLead,
      lead_email: data.leadEmail,
      lead_phone: data.leadPhone,
      lead_org: data.leadOrg,
      city: data.city,
      state: data.state,
      chosen_ps: data.chosenPs,
      ps_title: data.psTitle,
      why_reason: data.whyReason,
      skills: data.skills
    });
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      body: body
    });
    if (!res.ok) {
      console.error("[DRE] Backend POST failed with HTTP", res.status);
      return false;
    }
    const json = await res.json();
    if (!json.ok) {
      console.error("[DRE] Backend rejected registration:", json.error);
      if (json.error === "duplicate_email") {
        showToast("This email is already registered.", "warning");
      }
      return false;
    }
    return true;
  } catch (err) {
    // Apps Script can return opaque redirects; treat network errors as failure
    console.error("[DRE] Backend network error:", err);
    return false;
  }
}

// Fetch all registrations (used by admin.html viewer)
async function fetchRegistrationsFromBackend() {
  if (!backendReady) return [];
  try {
    const res = await fetch(BACKEND_URL, { method: "GET", redirect: "follow" });
    const json = await res.json();
    if (!json.ok) {
      console.error("[DRE] Backend GET failed:", json.error);
      return [];
    }
    return json.data || [];
  } catch (err) {
    console.error("[DRE] Backend network error:", err);
    return [];
  }
}

// Escaping helper: prevents user/data values from injecting markup into innerHTML
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

// 1. DATA REPOSITORY: 10 PROBLEM STATEMENTS & BOTTLENECK MAPPINGS (EXACT SOURCE DOCUMENT)
const PROBLEM_STATEMENTS = [
  {
    id: "PS 01",
    key: "ps1",
    theme: "agri",
    themeName: "Agriculture & Horticulture",
    chapterNum: "01",
    title: "Solar-Assisted Jaggery Processing: Closed-Loop Heat Control Rig",
    valueChain: "Sugarcane and jaggery.",
    oneSentence: "Build a bench-scale controller that keeps a boiling vessel on a target temperature profile even when the heat source varies.",
    challenge: "Local micro-enterprises struggle with inconsistent quality during sugarcane juice boiling due to uneven biomass or solar hybrid heat distribution. Overheating or underheating ruins the jaggery grade.",
    build: "A working rig with closed-loop control to manage uneven heat distribution.",
    deliverables: [
      "A working rig: a vessel (water or sugar syrup), at least two temperature sensors at different positions, and at least one actuator (damper, valve, heater dimmer or relay) under closed-loop control.",
      "A predictive 'pour now' alert (light, buzzer or display) based on the measured rate of temperature change, not a fixed timer.",
      "An automatic batch record that grades the batch from temperature consistency, viewable on a phone or a simple display.",
      "A bill of materials with total cost, and a short note on how the design would scale to a real jaggery pan."
    ],
    bottleneck: "Industrial heat decarbonization gap",
    techFocus: "Closed-loop control of variable heat sources using dampers, valves or heater control, measured against a temperature profile."
  },
  {
    id: "PS 02",
    key: "ps2",
    theme: "agri",
    themeName: "Agriculture & Horticulture",
    chapterNum: "01",
    title: "Solar Dryer Moisture Tracker: Weight-Based Drying Monitor",
    valueChain: "Coffee cultivation and cocoa beans.",
    oneSentence: "Build a small instrumented dryer that estimates the moisture of a sample and predicts the remaining drying time based on weight.",
    challenge: "Most farmers dry their produce under open sun, vulnerable to changing local weather. Solar tunnel dryers or large collective covered solar drying infrastructure will help. Those using tunnel dryers guess when the beans are perfectly dried. Taking them out too early causes mold, while leaving them in too long reduces weight and profits.",
    build: "A small instrumented dryer (enclosure or drying tray) that estimates the moisture of a sample and predicts the remaining drying time.",
    deliverables: [
      "A dryer enclosure or tray with a fan or vents, temperature and humidity sensors, and a load cell that tracks the sample's weight.",
      "A moisture estimate computed from weight loss and the starting moisture, with a live remaining-time estimate that updates as conditions change.",
      "An on-device alert (buzzer, light or display) when the target moisture is reached, for example 7% for coffee.",
      "An exportable drying log suitable for quality certification."
    ],
    bottleneck: "Agricultural metrology and quality risk",
    techFocus: "Weight-based moisture estimation and drying-curve prediction, checked against a reference."
  },
  {
    id: "PS 03",
    key: "ps3",
    theme: "agri",
    themeName: "Agriculture & Horticulture",
    chapterNum: "01",
    title: "DRE-Powered Jackfruit & Banana Flower Processing: Solar-Aware Scheduler",
    valueChain: "Secondary produce processing.",
    oneSentence: "Build a production scheduling and load balancing tool for a decentralized food processing hub.",
    challenge: "Tribal women's cooperatives could use solar-powered cutting, slicing, and dehydration machinery. Processing must happen immediately after harvest, but variable weather can cause the solar microgrid batteries to drain mid-operation.",
    build: "A production scheduling and load balancing tool for a decentralized food processing hub.",
    deliverables: [
      "A scheduler that takes harvest volumes, machine power ratings, battery capacity and a solar forecast, and recommends the best hours to run heavy slicing machines versus low-power dehydrators while avoiding battery depletion.",
      "A one-page printed schedule that a cooperative member can follow without a smartphone.",
      "A plain-language explanation of why each machine runs when it does."
    ],
    bottleneck: "Production and intermittency mismatch",
    techFocus: "Load balancing that matches machinery run times to solar generation and battery limits."
  },
  {
    id: "PS 04",
    key: "ps4",
    theme: "aqua",
    themeName: "Aquaculture & Cold Chain",
    chapterNum: "02",
    title: "Shrimp Hatcheries & Cold Storage: Thermal Pre-Cooling and Aerator Soft-Start Rig",
    valueChain: "Shrimp and prawn farming.",
    oneSentence: "Build a rig that stores cold when solar is available and starts motors gently to avoid surge currents.",
    challenge: "Shifting rural cold rooms and hatchery aerators completely to solar-plus-storage mini-grids is expensive due to high battery costs. Hatcheries face immediate crop spoilage if the power drops abruptly.",
    build: "A small-scale rig that demonstrates thermal storage and soft-starting high-inrush motors.",
    deliverables: [
      "An insulated mini cold box with thermal mass (water bottles or ice packs), temperature sensors, and a controller that safely over-cools during a 'solar window'.",
      "A small motor or pump (aerator stand-in) with a soft-start or ramp circuit and a current sensor that records the start-up surge with and without it.",
      "An emergency low-battery protocol that protects the aerator first and reduces the cold box load, demonstrated on a simulated battery state of charge.",
      "A measured comparison of energy drawn during the 'night' phase with and without pre-cooling."
    ],
    bottleneck: "Chemical battery capacity and lifetime cost",
    techFocus: "Soft-starting high-inrush induction motors and shifting load using thermal mass, measured on a real rig."
  },
  {
    id: "PS 05",
    key: "ps5",
    theme: "aqua",
    themeName: "Aquaculture & Cold Chain",
    chapterNum: "02",
    title: "Shared Solar Cooling Hub: Pay-As-You-Go Locker with a Real Lock",
    valueChain: "Marine fisheries and fresh vegetables.",
    oneSentence: "Build a booking and micro-billing system for shared solar cooling lockers, including a physical locker mechanism.",
    challenge: "Smallholder marginal farmers and fishermen cannot afford to buy their own solar refrigerators. Shared community cooling hubs exist, but managing manual slot bookings and transparent payment collection can be chaotic.",
    build: "A booking and micro-billing system for shared solar cooling lockers, including a physical locker mechanism that only opens for a valid booking.",
    deliverables: [
      "A working locker prototype (solenoid or servo latch with a controller) that opens only after a valid booking token is presented by QR code or RFID.",
      "A mock UPI payment flow (no real money) that bills per hour and per kg. A load cell for weight is a bonus.",
      "Offline tolerance: if connectivity drops, bookings and payments are queued and reconciled later without double charging.",
      "A dashboard showing diesel emissions avoided by the village, with the formula and the source of the emission factor stated."
    ],
    bottleneck: "Upfront capital expense (CapEx) barrier",
    techFocus: "Physical locker access, offline-tolerant micro-billing and slot reservation (CapEx to OpEx)."
  },
  {
    id: "PS 06",
    key: "ps6",
    theme: "msme",
    themeName: "Urban Infrastructure & Industrial MSMEs",
    chapterNum: "03",
    title: "Commercial Rooftop Solar Clusters: Transformer Hosting Capacity Simulator",
    valueChain: "Industrial MSMEs, pharma clusters and large commercial establishments.",
    oneSentence: "Build a geospatial solar penetration and transformer hosting capacity simulator for local utility networks.",
    challenge: "Rapid, uncoordinated rooftop solar adoption by commercial buildings pushes heavy reverse power back into local distribution transformers during sunny afternoons, risking grid failure.",
    build: "A geospatial solar penetration and transformer hosting capacity simulator for local utility networks.",
    deliverables: [
      "An interactive map (Streamlit, Leaflet or similar) showing local transformers, where a user can drop a pin to simulate adding a new rooftop system.",
      "A 'Grid Safety Impact Score' and a capacity threshold warning, with the method written out: which criterion you use and why.",
      "A clear statement of what data a real utility would need to make the tool reliable."
    ],
    bottleneck: "One-way distribution grid volatility",
    techFocus: "Geospatial transformer hosting capacity simulation and reverse-power warnings, checked against reference cases."
  },
  {
    id: "PS 07",
    key: "ps7",
    theme: "msme",
    themeName: "Urban Infrastructure & Industrial MSMEs",
    chapterNum: "03",
    title: "Manufacturing Clusters: Solar-Aware Demand Shifting Scheduler",
    valueChain: "Heavy fabrication, engineering and apparel manufacturing.",
    oneSentence: "Build a demand shifting scheduler that matches production schedules with solar availability and time-of-use (ToU) tariffs.",
    challenge: "Industrial units run heavy machinery during peak grid hours, driving up power costs, while their rooftop solar arrays generate excess power that goes to waste when the factories are dampening operations.",
    build: "A demand shifting scheduler that matches production schedules with solar availability and time-of-use (ToU) tariffs.",
    deliverables: [
      "A scheduling tool where factory managers enter order deadlines, machinery power ratings, ToU tariff slabs and a solar profile.",
      "An optimized shift schedule that maximizes direct solar consumption and minimizes peak-hour grid consumption, with the cost and solar share compared against a naive schedule.",
      "A list of the real-world constraints you handled (machine order, changeovers, operator shifts, maximum demand charges) and those you did not."
    ],
    bottleneck: "Demand-side flexibility deficit",
    techFocus: "Time-of-use scheduling that absorbs solar abundance under real production constraints."
  },
  {
    id: "PS 08",
    key: "ps8",
    theme: "tribal",
    themeName: "Tribal Livelihoods, Eco-Tourism & Field Operations",
    chapterNum: "04",
    title: "Tribal Machinery: Offline Fault Diagnostics on a Fault-Injectable Rig",
    valueChain: "Non-timber forest produce (pepper thrashers, solar cleaners, millet hullers in remote Paderu and Chintapalli).",
    oneSentence: "Build a small machine rig and an offline diagnostic reader that identifies faults and guides an operator through simple repairs.",
    challenge: "Processing machinery operates in remote valleys with zero or minimal internet connectivity. When an inverter or motor acts up, local operators cannot diagnose it, resulting in extended downtimes.",
    build: "A small machine rig and an offline diagnostic reader that identifies faults and guides an operator through simple repairs.",
    deliverables: [
      "A rig with a motor and driver (or inverter stand-in), sensors for current, voltage, temperature and speed, and at least four faults that can be physically introduced.",
      "An offline diagnostic device or app (phone via Bluetooth or local Wi-Fi, or a handheld with a display) that reads fault codes with no internet and walks the operator through simple repair steps using icons or Telugu prompts.",
      "A log compressed to fit a single SMS (160 characters) holding the device ID, fault, time and key readings, ready to send when a cell tower is found. Sending a real SMS is optional."
    ],
    bottleneck: "\"Last-mile\" diagnostic and maintenance gap",
    techFocus: "Offline fault detection on a real rig, guided repair and SMS-sized logging."
  },
  {
    id: "PS 09",
    key: "ps9",
    theme: "tribal",
    themeName: "Tribal Livelihoods, Eco-Tourism & Field Operations",
    chapterNum: "04",
    title: "Eco-Tourism Homestays: Microgrid Sizing Planner",
    valueChain: "Experiential tribal homestays and eco-resorts.",
    oneSentence: "Create an eco-resort microgrid planner and green metric tracker.",
    challenge: "Homestay owners want to go 100% green using solar and micro-hydro options, but they struggle to calculate how many panels or batteries they need without buying overly expensive commercial configurations.",
    build: "An eco-resort microgrid planner and green metric tracker.",
    deliverables: [
      "A simple, multilingual (Telugu and English) web form where the owner enters room count and appliances and receives a DRE blueprint (panels, battery, inverter and, where relevant, micro-hydro) with a cost range.",
      "Visible, editable assumptions (sun hours, battery depth of discharge, losses, days of autonomy).",
      "A guest-facing display of green metrics, such as 'Your stay today ran on 100% solar power, saving 12 kg of CO₂.' Every figure must come from a stated calculation and source."
    ],
    bottleneck: "Technical sizing and planning illiteracy",
    techFocus: "Converting appliance inventories into a verifiable clean-energy blueprint."
  },
  {
    id: "PS 10",
    key: "ps10",
    theme: "tribal",
    themeName: "Tribal Livelihoods, Eco-Tourism & Field Operations",
    chapterNum: "04",
    title: "Rural Enterprise Mobilization: Voice-Based Energy Audit Assistant",
    valueChain: "Rural enterprise mobilization and NGO field operations.",
    oneSentence: "Build a voice-based audit and baseline tool that works in regional languages.",
    challenge: "Field coordinators conducting energy audits across hundreds of tribal villages spend hours manually filling out forms to check if a solar pump or food processor is viable for a specific community cluster.",
    build: "A voice-based audit and baseline tool that works in regional languages.",
    deliverables: [
      "Voice input in Telugu and English that captures village data such as the number of active shops, current diesel costs and daily operating hours.",
      "Detection of missing or unclear values, with a follow-up question instead of a guess.",
      "A technical and economic feasibility summary in which every number traces to an input and a visible formula. No unexplained figures.",
      "Support for poor connectivity: record now, process later."
    ],
    bottleneck: "Feasibility study and energy audit delays",
    techFocus: "Voice-to-structured-data extraction with transparent feasibility calculations in regional languages."
  }
];

// Curated Chapters Definition
const THEME_CHAPTERS = [
  {
    num: "01",
    theme: "agri",
    title: "AGRICULTURE & HORTICULTURE",
    context: "Thermal stabilization, precise moisture metrology, and harvest scheduling for sugarcane, coffee, cocoa, and secondary forest produce."
  },
  {
    num: "02",
    theme: "aqua",
    title: "AQUACULTURE & COLD CHAIN",
    context: "Mitigating inductive inrush motor surges, shifting thermal mass during peak solar hours, and PAYG community refrigeration."
  },
  {
    num: "03",
    theme: "msme",
    title: "URBAN INFRASTRUCTURE & INDUSTRIAL MSMEs",
    context: "Distribution grid transformer hosting safety, reverse power management, and dynamic Time-of-Use production scheduling."
  },
  {
    num: "04",
    theme: "tribal",
    title: "TRIBAL LIVELIHOODS, ECO-TOURISM & FIELD OPERATIONS",
    context: "Offline-first diagnostics, bilingual eco-tourism microgrid sizing, and voice-assisted field energy audits in remote agency tracts."
  }
];

// 2. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  renderChaptersView("all");
  renderBottleneckMatrix();
  initChapterFilters();
  initDelegatedHandlers();
  initSearch();
  initModal();
  initRegistrationDropdown();
  initRegistrationForm();
  initNumberCounters();
  initMobileNav();
  checkSavedRegistration();
  initAndhraRealMap();
});

// 3. RENDER CHALLENGE CHAPTERS (VISUAL CHAPTERS LAYOUT)
function renderChaptersView(filterTheme = "all", query = "") {
  const container = document.getElementById("chaptersContainer");
  if (!container) return;

  const searchQuery = query.trim().toLowerCase();

  // Filter matching problems (pure helper shared with the test suite)
  const logic = (typeof DreLogic !== "undefined")
    ? DreLogic
    : (typeof require === "function" ? require("./logic.js") : null);
  const filteredProblems = logic
    ? logic.filterProblems(PROBLEM_STATEMENTS, { theme: filterTheme, query })
    : [];

  if (filteredProblems.length === 0) {
    container.innerHTML = `
      <div class="empty-search-state">
        <p style="font-size: 1.1rem; color: var(--text-charcoal); font-weight: 700; margin-bottom: 0.35rem;">No challenges match your search query.</p>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">Try searching for another crop, machine type, or bottleneck.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFiltersAndSearch()">Reset Filters</button>
      </div>
    `;
    return;
  }

  // Group by chapter
  const visibleChapters = THEME_CHAPTERS.filter(ch => {
    if (filterTheme !== "all" && ch.theme !== filterTheme) return false;
    return filteredProblems.some(p => p.theme === ch.theme);
  });

  container.innerHTML = visibleChapters.map(ch => {
    const chapterProblems = filteredProblems.filter(p => p.theme === ch.theme);

    return `
      <section class="challenge-chapter-block" id="chapter-${ch.theme}">
        <header class="chapter-header">
          <span class="chapter-num-tag">${ch.num}</span>
          <h3 class="chapter-heading">${ch.title}</h3>
          <p class="chapter-context-desc">${ch.context}</p>
        </header>

        <div class="chapter-cards-grid">
          ${chapterProblems.map(item => `
            <article class="editorial-challenge-card" data-id="${escapeHtml(item.id)}">
              <div class="card-meta-top">
                <span class="card-ps-num">${escapeHtml(item.id)}</span>
                <span class="card-theme-tag">${escapeHtml(item.themeName)}</span>
              </div>

              <h4 class="card-headline">${escapeHtml(item.title)}</h4>

              <p class="card-summary-p">${escapeHtml(item.oneSentence)}</p>

              <div class="card-tech-section">
                <div class="tech-section-label">TECHNICAL FOCUS</div>
                <div class="tech-section-content">${escapeHtml(item.techFocus)}</div>
              </div>

              <div class="card-bottom-action">
                <button class="btn-card-explore" data-ps-id="${escapeHtml(item.id)}">
                  EXPLORE →
                </button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');
}

// 4. CHAPTER FILTERS & SEARCH
// Delegated click handling replaces all inline onclick="..." strings.
function initDelegatedHandlers() {
  // Challenge cards: EXPLORE button
  const chaptersContainer = document.getElementById("chaptersContainer");
  if (chaptersContainer) {
    chaptersContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-card-explore");
      if (btn) openProblemModal(btn.getAttribute("data-ps-id"));
    });
  }

  // Bottleneck matrix rows + Select buttons
  const tbody = document.getElementById("matrixTableBody");
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const selectBtn = e.target.closest(".btn-report-select");
      if (selectBtn) {
        chooseChallengeFromModal(selectBtn.getAttribute("data-ps-id"));
        return;
      }
      const viewBtn = e.target.closest("[data-action='view']");
      if (viewBtn) {
        openProblemModal(viewBtn.getAttribute("data-ps-id"));
        return;
      }
      const row = e.target.closest(".report-row");
      if (row) highlightMatrixRow(row.getAttribute("data-id"));
    });
  }

  // Matrix detail box action buttons
  const detailBox = document.getElementById("matrixDetailBox");
  if (detailBox) {
    detailBox.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ps-id][data-action]");
      if (!btn) return;
      if (btn.getAttribute("data-action") === "view") {
        openProblemModal(btn.getAttribute("data-ps-id"));
      } else {
        chooseChallengeFromModal(btn.getAttribute("data-ps-id"));
      }
    });
  }
}

function initChapterFilters() {
  const buttons = document.querySelectorAll(".chapter-tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const theme = btn.getAttribute("data-theme");
      const searchInput = document.getElementById("challengeSearchInput");
      renderChaptersView(theme, searchInput ? searchInput.value : "");
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById("challengeSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const activeBtn = document.querySelector(".chapter-tab-btn.active");
    const activeTheme = activeBtn ? activeBtn.getAttribute("data-theme") : "all";
    renderChaptersView(activeTheme, e.target.value);
  });
}

function resetFiltersAndSearch() {
  const searchInput = document.getElementById("challengeSearchInput");
  if (searchInput) searchInput.value = "";
  const allBtn = document.querySelector('.chapter-tab-btn[data-theme="all"]');
  if (allBtn) allBtn.click();
}

// 5. PROBLEM DETAIL MODAL
function closeModal() {
  const modal = document.getElementById("editorialProblemModal");
  const overlay = document.getElementById("modalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "auto";
}
window.closeModal = closeModal;

function initModal() {
  const modal = document.getElementById("editorialProblemModal");
  const closeBtn = document.getElementById("modalCloseBtn");
  const overlay = document.getElementById("modalOverlay");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (overlay) overlay.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

function openProblemModal(psId) {
  const item = PROBLEM_STATEMENTS.find(p => p.id === psId);
  if (!item) return;

  const modal = document.getElementById("editorialProblemModal");
  const overlay = document.getElementById("modalOverlay");
  if (!modal || !overlay) return;

  // Ensure any inline expanded detail box is closed when viewing full challenge
  const detailBox = document.getElementById("matrixDetailBox");
  if (detailBox) detailBox.style.display = "none";
  document.querySelectorAll(".report-row").forEach(r => r.classList.remove("row-selected"));

  document.getElementById("modalPsId").textContent = item.id;
  document.getElementById("modalThemeBadge").textContent = item.themeName;
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalValueChain").textContent = item.valueChain;
  document.getElementById("modalChallenge").textContent = item.challenge;
  document.getElementById("modalBuild").textContent = item.build;

  const delivList = document.getElementById("modalDeliverables");
  delivList.innerHTML = item.deliverables.map(d => `<li>${d}</li>`).join('');

  document.getElementById("modalTechFocus").textContent = item.techFocus;
  document.getElementById("modalBottleneck").textContent = item.bottleneck;

  const chooseBtn = document.getElementById("modalChooseBtn");
  if (chooseBtn) {
    chooseBtn.onclick = () => {
      chooseChallengeFromModal(item.id);
    };
  }

  modal.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function chooseChallengeFromModal(psId) {
  closeModal();

  const select = document.getElementById("regProblemDropdown");
  if (select) {
    select.value = psId;
    select.dispatchEvent(new Event("change"));
  }

  const regSection = document.getElementById("registration");
  if (regSection) {
    regSection.scrollIntoView({ behavior: "smooth" });
  }

  showToast(`Selected ${psId} in your registration form`, "success");
}

// 6. BOTTLENECK MATRIX (CONSULTING REPORT TABLE)
function renderBottleneckMatrix() {
  const tbody = document.getElementById("matrixTableBody");
  if (!tbody) return;

  tbody.innerHTML = PROBLEM_STATEMENTS.map(item => `
    <tr class="report-row" data-id="${escapeHtml(item.id)}">
      <td class="report-ps-id">${escapeHtml(item.id)}</td>
      <td class="report-prob-col">
        <div class="report-prob-title">${escapeHtml(item.title)}</div>
        <div class="report-prob-theme">${escapeHtml(item.themeName)}</div>
      </td>
      <td class="report-bottleneck-col">
        <span class="report-bottleneck-text">${escapeHtml(item.bottleneck)}</span>
      </td>
      <td class="report-tech-col">${escapeHtml(item.techFocus)}</td>
      <td class="report-action-col">
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-sm btn-outline" style="padding: 4px 12px; font-size: 0.8rem;" data-ps-id="${escapeHtml(item.id)}" data-action="view">
            View Full Challenge
          </button>
          <button class="btn btn-report-select" data-ps-id="${escapeHtml(item.id)}">
            Select
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function highlightMatrixRow(psId) {
  const rows = document.querySelectorAll(".report-row");
  rows.forEach(r => {
    if (r.getAttribute("data-id") === psId) {
      r.classList.toggle("row-selected");
    } else {
      r.classList.remove("row-selected");
    }
  });

  const detailBox = document.getElementById("matrixDetailBox");
  const item = PROBLEM_STATEMENTS.find(p => p.id === psId);
  if (detailBox && item) {
    detailBox.innerHTML = `
      <div class="matrix-selection-panel">
        <div class="msp-header">
          <strong style="color: var(--text-charcoal); font-size: 1.05rem;">${escapeHtml(item.id)}: ${escapeHtml(item.title)}</strong>
          <span class="theme-tag" style="color: var(--brand-forest); font-weight: 700;">${escapeHtml(item.themeName)}</span>
        </div>
        <div class="msp-grid">
          <div>
            <div class="msp-label">GLOBAL BOTTLENECK</div>
            <div class="msp-val msp-forest">${escapeHtml(item.bottleneck)}</div>
          </div>
          <div>
            <div class="msp-label">CORE TECHNICAL FOCUS</div>
            <div class="msp-val">${escapeHtml(item.techFocus)}</div>
          </div>
        </div>
        <div class="msp-actions">
          <button class="btn btn-sm btn-outline" data-ps-id="${escapeHtml(item.id)}" data-action="view">View Full Challenge</button>
          <button class="btn btn-sm btn-primary" data-ps-id="${escapeHtml(item.id)}" data-action="select">Select for Registration →</button>
        </div>
      </div>
    `;
    detailBox.style.display = "block";
  }
}

// 7. REGISTRATION DROPDOWN & FORM HANDLERS
function initRegistrationDropdown() {
  const select = document.getElementById("regProblemDropdown");
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose one of the 10 Problem Statements --</option>' +
    PROBLEM_STATEMENTS.map(p => `
      <option value="${escapeHtml(p.id)}">${escapeHtml(p.id)}: ${escapeHtml(p.title)} (${escapeHtml(p.themeName)})</option>
    `).join('');

  select.addEventListener("change", (e) => {
    const preview = document.getElementById("selectedProblemPreview");
    if (!preview) return;
    const item = PROBLEM_STATEMENTS.find(p => p.id === e.target.value);
    if (item) {
      preview.innerHTML = `
        <div class="ps-preview-strip">
          <div style="font-weight: 700; color: var(--text-charcoal); margin-bottom: 0.2rem;">
            ${escapeHtml(item.id)} — ${escapeHtml(item.title)}
          </div>
          <div style="color: var(--text-muted); font-size: 0.82rem;">
            <span><strong>Bottleneck:</strong> ${escapeHtml(item.bottleneck)}</span> &bull;
            <span><strong>Technical Focus:</strong> ${escapeHtml(item.techFocus)}</span>
          </div>
        </div>
      `;
    } else {
      preview.innerHTML = "";
    }
  });
}

function initRegistrationForm() {
  const form = document.getElementById("dreRegistrationForm");
  if (!form) return;

  const addMemberBtn = document.getElementById("addMemberBtn");
  const teamMembersList = document.getElementById("teamMembersList");

  if (addMemberBtn && teamMembersList) {
    addMemberBtn.addEventListener("click", () => {
      const currentCount = teamMembersList.querySelectorAll(".dynamic-member-input").length;
      if (currentCount < 5) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "field-input dynamic-member-input";
        input.placeholder = `Member ${currentCount + 1} Name`;
        input.required = true;
        teamMembersList.appendChild(input);

        if (currentCount + 1 >= 5) {
          addMemberBtn.style.display = "none";
        }
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const teamName = document.getElementById("regTeamName")?.value.trim();
    const teamLead = document.getElementById("regLeadName")?.value.trim();
    const leadEmail = document.getElementById("regLeadEmail")?.value.trim();
    const leadPhone = document.getElementById("regLeadPhone")?.value.trim();
    const leadOrg = document.getElementById("regLeadOrg")?.value.trim();
    const city = document.getElementById("regCity")?.value.trim();
    const state = document.getElementById("regState")?.value.trim();
    const githubLink = document.getElementById("regGithub")?.value.trim();
    const linkedinLink = document.getElementById("regLinkedin")?.value.trim();
    const chosenPs = document.getElementById("regProblemDropdown")?.value;
    const whyReason = document.getElementById("regWhyChosen")?.value.trim();
    const skills = document.getElementById("regSkills")?.value.trim();
    const terms = document.getElementById("regTerms")?.checked;
    
    // Gather dynamic team members
    const memberInputs = document.querySelectorAll(".dynamic-member-input");
    const membersList = Array.from(memberInputs).map(inp => inp.value.trim()).filter(v => v !== "");
    const teamMembersString = membersList.join(", ");

    if (!teamName || !teamLead || !leadEmail || !leadPhone || !leadOrg || !city || !state || !chosenPs || !githubLink || !linkedinLink) {
      showToast("Please fill in all mandatory fields (*)", "warning");
      return;
    }

    if (!terms) {
      showToast("Please accept the terms & conditions", "warning");
      return;
    }

    // Generate collision-resistant Registration ID: DRE-2026-AP-XXXX
    const regId = generateRegistrationId();
    const selectedObj = PROBLEM_STATEMENTS.find(p => p.id === chosenPs);

    const submissionData = {
      regId,
      teamName,
      teamLead,
      leadEmail,
      leadPhone,
      leadOrg,
      city,
      state,
      chosenPs,
      psTitle: selectedObj ? selectedObj.title : chosenPs,
      teamMembers: teamMembersString,
      githubLink,
      linkedinLink,
      whyReason,
      skills,
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    try {
      localStorage.setItem("dre_reg_record", JSON.stringify(submissionData));
    } catch (err) {
      console.warn("LocalStorage save warning", err);
    }

    // Persist to the Google Sheet backend so organizers can see all registrations
    const cloudSaved = await saveRegistrationToBackend(submissionData);
    if (!cloudSaved) {
      showToast("Saved locally — cloud sync unavailable. Please check backend config.", "warning");
    }

    renderRegistrationSuccess(submissionData);
    showToast(`Registration received! ID: ${regId}`, "success");
  });
}

function generateRegistrationId() {
  const randomCode = () => String(Math.floor(1000 + Math.random() * 9000)).padStart(4, "0");
  const cryptoObj = window.crypto || window.msCrypto;
  const pickCode = () => {
    if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
      // Bias-free 4-digit draw from the CSPRNG (rejection sampling)
      const LIMIT = Math.floor(0xFFFFFFFF / 10000) * 10000;
      const buf = new Uint32Array(1);
      let value;
      do {
        cryptoObj.getRandomValues(buf);
        value = buf[0] % 10000;
      } while (buf[0] >= LIMIT);
      return String(value).padStart(4, "0");
    }
    return randomCode();
  };

  // Avoid colliding with an existing stored registration
  let storedIds = [];
  try {
    const saved = JSON.parse(localStorage.getItem("dre_reg_record") || "null");
    if (saved && saved.regId) storedIds.push(saved.regId);
  } catch (e) { /* ignore */ }

  let regId = `DRE-2026-AP-${pickCode()}`;
  let attempts = 0;
  while (storedIds.includes(regId) && attempts < 50) {
    regId = `DRE-2026-AP-${pickCode()}`;
    attempts++;
  }
  return regId;
}

function renderRegistrationSuccess(data) {
  const formCard = document.getElementById("registrationFormSheet");
  const successCard = document.getElementById("registrationSuccessCard");
  if (!formCard || !successCard) return;

  const confFields = {
    confRegId: data.regId,
    confTeamName: data.teamName,
    confTeamLead: data.teamLead,
    confOrg: data.leadOrg,
    confChallenge: `${data.chosenPs}: ${data.psTitle}`,
    confDate: data.submittedAt
  };
  for (const [fieldId, value] of Object.entries(confFields)) {
    const el = document.getElementById(fieldId);
    if (el) el.textContent = value;
  }

  const pocInput = document.getElementById("pocSubmissionUrl");
  if (pocInput) {
    pocInput.value = `${window.location.origin}/poc-submission.html?team=${encodeURIComponent(data.regId)}`;
  }

  formCard.style.display = "none";
  successCard.style.display = "block";
  successCard.scrollIntoView({ behavior: "smooth" });
}

function copyPocUrl() {
  const input = document.getElementById("pocSubmissionUrl");
  if (!input) return;
  input.select();
  input.setSelectionRange(0, 99999);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast("PoC submission link copied to clipboard!", "success");
    }).catch(() => {
      copyViaExecCommand(input);
    });
  } else {
    copyViaExecCommand(input);
  }
}

function copyViaExecCommand(input) {
  const succeeded = document.execCommand("copy");
  if (succeeded) {
    showToast("PoC submission link copied!", "success");
  } else {
    showToast("Could not copy automatically — please copy the link manually.", "warning");
  }
}

function checkSavedRegistration() {
  try {
    const saved = localStorage.getItem("dre_reg_record");
    if (saved) {
      const data = JSON.parse(saved);
      const confBanner = document.getElementById("existingRegBanner");
      if (confBanner) {
        confBanner.innerHTML = `
          <div class="existing-reg-alert">
            <span>You have an existing registered team: <strong>${escapeHtml(data.teamName)}</strong> (${escapeHtml(data.regId)}) for <strong>${escapeHtml(data.chosenPs)}</strong>.</span>
            <button class="btn btn-sm btn-outline" id="viewReceiptBtn">View Receipt</button>
          </div>
        `;
        const receiptBtn = document.getElementById("viewReceiptBtn");
        if (receiptBtn) receiptBtn.addEventListener("click", showSavedRegistrationModal);
        confBanner.style.display = "block";
      }
    }
  } catch (e) {
    console.warn("Could not read saved registration", e);
  }
}

function showSavedRegistrationModal() {
  try {
    const saved = localStorage.getItem("dre_reg_record");
    if (saved) {
      renderRegistrationSuccess(JSON.parse(saved));
    }
  } catch (e) {
    console.warn(e);
  }
}

function editRegistration() {
  const formCard = document.getElementById("registrationFormSheet");
  const successCard = document.getElementById("registrationSuccessCard");
  if (formCard && successCard) {
    successCard.style.display = "none";
    formCard.style.display = "block";
    formCard.scrollIntoView({ behavior: "smooth" });
  }
}

// 8. FAQ ACCORDION
function toggleFaqItem(button) {
  const item = button.closest(".faq-entry");
  if (!item) return;
  const wasActive = item.classList.contains("open");

  document.querySelectorAll(".faq-entry").forEach(el => el.classList.remove("open"));

  if (!wasActive) {
    item.classList.add("open");
  }
}

// 9. ANIMATED STATISTIC COUNTERS ON SCROLL
function initNumberCounters() {
  const statElements = document.querySelectorAll(".stat-counter");
  if (!statElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute("data-target"));
        const suffix = el.getAttribute("data-suffix") || "";
        const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        animateCounter(el, targetVal, suffix, decimals);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  statElements.forEach(el => observer.observe(el));
}

function animateCounter(el, target, suffix, decimals) {
  let start = 0;
  const duration = 1100;
  const startTime = performance.now();
  const logic = (typeof DreLogic !== "undefined")
    ? DreLogic
    : (typeof require === "function" ? require("./logic.js") : null);

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = logic
      ? logic.easedCounterValue(start, target, progress)
      : start + (target - start) * (1 - Math.pow(1 - progress, 3));

    el.textContent = current.toFixed(decimals) + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toFixed(decimals) + suffix;
    }
  }

  requestAnimationFrame(step);
}

// 10. MOBILE NAV
function initMobileNav() {
  const toggle = document.getElementById("mobileNavBtn");
  const menu = document.getElementById("mobileNavMenu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
    });

    document.querySelectorAll(".mobile-nav-link").forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
      });
    });
  }
}

// 11. TOAST NOTIFICATIONS
function showToast(msg, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}</span> <span>${escapeHtml(msg)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// 12. REAL LEAFLET MAP OF ANDHRA PRADESH (FIELD CORRIDORS)
const ANDHRA_CORRIDORS = [
  {
    id: "gajuwaka",
    name: "Gajuwaka Industrial Cluster (Visakhapatnam)",
    category: "URBAN INFRASTRUCTURE & INDUSTRIAL MSMEs",
    coords: [17.6905, 83.2098],
    zoom: 12,
    coordText: "17.69° N, 83.21° E",
    desc: "Heavy commercial rooftop solar adoption pushes uncoordinated reverse power back into 11kV/33kV distribution transformers during sunny afternoons, risking transformer overheating and feeder breaker trips.",
    psTag: "PS 06 & PS 07",
    primaryPs: "PS 06"
  },
  {
    id: "atchutapuram",
    name: "Atchutapuram Industrial SEZ Corridor",
    category: "INDUSTRIAL CLUSTERS & FEEDER BALANCING",
    coords: [17.5420, 82.9860],
    zoom: 12,
    coordText: "17.54° N, 82.99° E",
    desc: "Large manufacturing clusters experience high peak-hour grid tariffs and uncoordinated load shedding, while excess daytime rooftop solar cannot be dynamically absorbed without Time-of-Use shifting.",
    psTag: "PS 07 & PS 06",
    primaryPs: "PS 07"
  },
  {
    id: "paderu",
    name: "Paderu Agency Tract (Eastern Ghats)",
    category: "TRIBAL LIVELIHOODS & AGRO-PROCESSING",
    coords: [18.0833, 82.6667],
    zoom: 11,
    coordText: "18.08° N, 82.67° E",
    desc: "Tribal coffee, pepper, and millet cooperatives experience weeks of harvest-spoiling downtime when processing machinery trips in off-grid agency valleys due to a complete lack of local diagnostic tools.",
    psTag: "PS 08 & PS 02",
    primaryPs: "PS 08"
  },
  {
    id: "chintapalli",
    name: "Chintapalli Forest Valleys",
    category: "OFFLINE MACHINERY & LIVELIHOODS",
    coords: [17.8667, 82.3500],
    zoom: 11,
    coordText: "17.87° N, 82.35° E",
    desc: "Remote non-timber forest produce processing operates with zero cellular coverage. Machinery maintenance demands offline Bluetooth diagnostics and compressed text-over-SMS logging.",
    psTag: "PS 08 & PS 10",
    primaryPs: "PS 08"
  },
  {
    id: "aquaculture",
    name: "Coastal Aquaculture & Cold Storage Belt",
    category: "AQUACULTURE & COLD CHAIN",
    coords: [16.5449, 81.5212],
    zoom: 10,
    coordText: "16.54° N, 81.52° E",
    desc: "Continuous shrimp aeration and cold rooms draw heavy inductive motor inrush currents, tripping low-cost rural solar microgrids and causing premature chemical battery bank degradation.",
    psTag: "PS 04 & PS 05",
    primaryPs: "PS 04"
  },
  {
    id: "secretariat",
    name: "Event Secretariat & Hackathon Venue (Visakhapatnam)",
    category: "EVENT SECRETARIAT & HELPDESK",
    coords: [17.732, 83.315],
    zoom: 14,
    coordText: "17.732° N, 83.315° E",
    desc: "52-14-75 Survey No:44, National Highway 16, Near Rama Talkies Rd, Old TB Hospital Area, Resapuvanipalem, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530013. Phone: 0891-2551630.",
    psTag: "Contact Desk",
    primaryPs: "PS 01"
  }
];

let andhraMapInstance = null;
const andhraMarkers = {};

const LEAFLET_MAX_RETRIES = 10;

function initAndhraRealMap(retryCount = 0) {
  const mapContainer = document.getElementById("andhraRealMap");
  if (!mapContainer) return;

  // Verify Leaflet loaded; give up after a bounded number of retries
  if (typeof L === "undefined") {
    if (retryCount >= LEAFLET_MAX_RETRIES) {
      console.warn("Leaflet library failed to load after retries.");
      mapContainer.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:320px;text-align:center;padding:1.5rem;background:var(--bg-paper, #f6f4ef);color:var(--text-muted, #6b6b6b);font-size:0.95rem;">
          <p>The interactive field-corridor map could not load (map library unavailable).<br>All corridor details remain available in the list below.</p>
        </div>
      `;
      return;
    }
    setTimeout(() => initAndhraRealMap(retryCount + 1), 300);
    return;
  }

  andhraMapInstance = createMapInstance();
  addCorridorMarkers();
  bindCorridorPillControls();

  // Initial inspector update
  updateMapInspector(ANDHRA_CORRIDORS[0]);
}

function createMapInstance() {
  const defaultCenter = [16.75, 81.5];
  const defaultZoom = 7;

  const map = L.map("andhraRealMap", {
    center: defaultCenter,
    zoom: defaultZoom,
    minZoom: 6,
    maxZoom: 14,
    scrollWheelZoom: false,
    zoomControl: true,
    maxBounds: [
      [12.0, 75.5],
      [20.5, 86.0]
    ]
  });

  // Esri Dark Gray Canvas Tiles (Free, High-contrast, elegant, publication-grade cartography)
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  return map;
}

function addCorridorMarkers() {
  // Custom Pulsing DivIcon Maker
  const createMarkerIcon = (label) => {
    return L.divIcon({
      className: "dre-leaflet-divicon",
      html: `
        <div class="dre-leaflet-marker" title="${escapeHtml(label)}">
          <div class="dre-marker-pulse"></div>
          <div class="dre-marker-dot"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Add markers for all corridors
  ANDHRA_CORRIDORS.forEach(corridor => {
    const marker = L.marker(corridor.coords, {
      icon: createMarkerIcon(corridor.name)
    }).addTo(andhraMapInstance);

    const popupHtml = `
      <div class="popup-station-badge">${escapeHtml(corridor.category)}</div>
      <div class="popup-station-name">${escapeHtml(corridor.name)}</div>
      <div class="popup-station-constraint">${escapeHtml(corridor.desc)}</div>
      <span class="popup-ps-link" data-ps-id="${escapeHtml(corridor.primaryPs)}">Open ${escapeHtml(corridor.psTag)} Challenge →</span>
    `;

    marker.bindPopup(popupHtml, {
      maxWidth: 280,
      className: "dre-popup-container"
    });

    marker.on("popupopen", () => {
      const link = document.querySelector(".dre-popup-container .popup-ps-link");
      if (link) {
        link.addEventListener("click", () => openProblemModal(link.getAttribute("data-ps-id")));
      }
    });

    marker.on("click", () => {
      updateMapInspector(corridor);
      setActiveCorridorPill(corridor.id);
    });

    andhraMarkers[corridor.id] = marker;
  });
}

function bindCorridorPillControls() {
  // Pills Interaction
  const pills = document.querySelectorAll(".corridor-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      const id = pill.getAttribute("data-id");
      focusMapLocation(id);
    });
  });

  // Reset Button
  const resetBtn = document.getElementById("resetMapBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      focusMapLocation("all");
    });
  }
}

function updateMapInspector(corridor) {
  const badge = document.getElementById("inspCategory");
  const coord = document.getElementById("inspCoords");
  const title = document.getElementById("inspTitle");
  const desc = document.getElementById("inspDesc");
  const psTag = document.getElementById("inspPsTag");
  const btn = document.getElementById("inspActionBtn");

  if (badge) badge.textContent = corridor.category;
  if (coord) coord.textContent = corridor.coordText;
  if (title) title.textContent = corridor.name;
  if (desc) desc.textContent = corridor.desc;
  if (psTag) psTag.innerHTML = `Addressed in <strong>${corridor.psTag}</strong>`;
  if (btn) {
    btn.onclick = () => openProblemModal(corridor.primaryPs);
    btn.textContent = `Explore ${corridor.primaryPs} →`;
  }
}

function setActiveCorridorPill(id) {
  document.querySelectorAll(".corridor-pill").forEach(p => {
    if (p.getAttribute("data-id") === id) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });
}

window.focusMapLocation = function(id) {
  if (!andhraMapInstance) return;

  if (id === "all") {
    andhraMapInstance.flyTo([16.75, 81.5], 7, { duration: 1.2 });
    setActiveCorridorPill("all");
    updateMapInspector(ANDHRA_CORRIDORS[0]);
    andhraMapInstance.closePopup();
    return;
  }

  const corridor = ANDHRA_CORRIDORS.find(c => c.id === id);
  if (!corridor) return;

  andhraMapInstance.flyTo(corridor.coords, corridor.zoom, { duration: 1.2 });
  setActiveCorridorPill(corridor.id);
  updateMapInspector(corridor);

  const marker = andhraMarkers[corridor.id];
  if (marker) {
    setTimeout(() => {
      marker.openPopup();
    }, 600);
  }
};

/* ── Mobile Sticky CTA Visibility Handler ── */
document.addEventListener("DOMContentLoaded", () => {
  const regSection = document.getElementById("registration");
  const mobileStickyBar = document.querySelector(".mobile-sticky-bar");
  
  if (regSection && mobileStickyBar) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Registration form is in view -> hide duplicate sticky CTA
          mobileStickyBar.style.display = "none";
        } else {
          // Registration form is out of view -> show sticky CTA (reverts to CSS media query display logic)
          mobileStickyBar.style.display = "";
        }
      });
    }, {
      root: null,
      threshold: 0.1 // Triggers when at least 10% of registration section is visible
    });
    
    observer.observe(regSection);
  }
});

/* ── Contact Form Handler ── */
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactQueryForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("cqSubmitBtn");
      const status = document.getElementById("cqStatus");
      btn.disabled = true;
      btn.textContent = "Sending...";
      status.style.display = "none";
      
      const payload = new URLSearchParams();
      payload.append("action", "contact");
      payload.append("name", document.getElementById("cqName").value.trim());
      payload.append("email", document.getElementById("cqEmail").value.trim());
      payload.append("message", document.getElementById("cqMessage").value.trim());
      
      try {
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString()
        });
        const data = await res.json();
        if (data.ok) {
          status.textContent = "Query sent successfully! We will get back to you soon.";
          status.style.color = "var(--brand-forest)";
          status.style.display = "block";
          contactForm.reset();
        } else {
          throw new Error("Failed to send");
        }
      } catch (err) {
        status.textContent = "Error sending query. Please try again.";
        status.style.color = "#D32F2F";
        status.style.display = "block";
      } finally {
        btn.disabled = false;
        btn.textContent = "Send Query →";
      }
    });
  }
});

// Poster Modal Logic
function closePosterModal() {
  const modal = document.getElementById('posterModal');
  if(modal) {
    modal.classList.remove('active');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Show poster modal on initial load (only once per session)
  if (!sessionStorage.getItem('posterShown')) {
    setTimeout(() => {
      const modal = document.getElementById('posterModal');
      if(modal) {
        modal.classList.add('active');
        sessionStorage.setItem('posterShown', 'true');
      }
    }, 500); // 500ms delay for nice effect
  }

  // Back to Top Button Logic
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});
