const DATA_PATH = "data/competitions.json";

const state = {
  competitions: [],
  activeCategory: "All",
};

const categoryFilters = document.querySelector("#categoryFilters");
const competitionList = document.querySelector("#competitionList");
const resultCount = document.querySelector("#resultCount");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const response = await fetch(DATA_PATH);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.competitions = await response.json();
    renderFilters();
    renderCompetitions();
  } catch (error) {
    competitionList.innerHTML = `
      <p class="error">
        コンペ情報を読み込めませんでした。ローカルサーバー経由で開いているか確認してください。
      </p>
    `;
    resultCount.textContent = "";
    console.error("Failed to load competitions:", error);
  }
}

function renderFilters() {
  const categories = [...new Set(state.competitions.flatMap(getCategoryParts))].sort((a, b) =>
    a.localeCompare(b, "ja")
  );

  categoryFilters.innerHTML = "";
  ["All", ...categories].forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category === "All" ? "すべて" : category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", category === state.activeCategory ? "true" : "false");

    if (category === state.activeCategory) {
      button.classList.add("is-active");
    }

    button.addEventListener("click", () => {
      state.activeCategory = category;
      renderFilters();
      renderCompetitions();
    });

    categoryFilters.appendChild(button);
  });
}

function renderCompetitions() {
  const filtered = state.activeCategory === "All"
    ? state.competitions
    : state.competitions.filter((competition) =>
        getCategoryParts(competition).includes(state.activeCategory)
      );

  resultCount.textContent = `${filtered.length}件`;

  if (filtered.length === 0) {
    competitionList.innerHTML = '<p class="empty">該当するコンペはありません。</p>';
    return;
  }

  competitionList.innerHTML = "";
  const grouped = groupCompetitionsByCountry(filtered);

  grouped.forEach(([country, competitions]) => {
    const section = document.createElement("section");
    section.className = "country-section";

    const heading = document.createElement("h2");
    heading.className = "country-heading";
    heading.textContent = `${getCountryFlag(country)} ${country}`;

    const grid = document.createElement("div");
    grid.className = "competition-grid";

    competitions.forEach((competition) => {
      grid.appendChild(createCompetitionCard(competition));
    });

    section.append(heading, grid);
    competitionList.appendChild(section);
  });
}

function createCompetitionCard(competition) {
  const card = document.createElement("article");
  card.className = "competition-card";

  const body = document.createElement("div");
  body.className = "card-body";

  const category = document.createElement("span");
  category.className = "category-label";
  category.textContent = competition.category || "未分類";

  const title = document.createElement("h3");
  title.textContent = competition.name || "名称未設定";

  const metaList = document.createElement("dl");
  metaList.className = "meta-list";
  metaList.append(
    createMetaRow("対象地域", formatEligibility(competition.eligibility)),
    createMetaRow("締切", competition.deadline),
    createMetaRow("参加費", competition.entryFee),
    createMetaRow("難易度", competition.difficulty)
  );

  const notes = document.createElement("p");
  notes.className = "notes";
  notes.textContent = competition.notes || "備考なし";

  body.append(category, title, metaList, notes);

  if (competition.link) {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = competition.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "公式サイト";
    body.appendChild(link);
  }

  card.appendChild(body);
  return card;
}

function createMetaRow(label, value) {
  const row = document.createElement("div");
  row.className = "meta-row";

  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = value || "Unknown";

  row.append(term, description);
  return row;
}

function getCategoryParts(competition) {
  return String(competition.category || "未分類")
    .split("/")
    .map((category) => category.trim())
    .filter(Boolean);
}

function groupCompetitionsByCountry(competitions) {
  const groups = new Map();

  competitions.forEach((competition) => {
    const country = competition.country || "Unknown";

    if (!groups.has(country)) {
      groups.set(country, []);
    }

    groups.get(country).push(competition);
  });

  return [...groups.entries()];
}

function getCountryFlag(country) {
  const flags = {
    Australia: "🇦🇺",
    Canada: "🇨🇦",
    China: "🇨🇳",
    Croatia: "🇭🇷",
    France: "🇫🇷",
    Germany: "🇩🇪",
    Japan: "🇯🇵",
    Netherlands: "🇳🇱",
    "South Korea": "🇰🇷",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
  };

  return flags[country] || "🏳️";
}

function formatEligibility(eligibility) {
  const labels = {
    worldwide: "🌍 Open Worldwide（全世界から応募可能）",
    international: "🌍 Open Internationally（海外から応募可能）",
    international_students: "🎓 Open to International Students（海外の学生も応募可能）",
    conditional: "⚠️ Check Eligibility（条件あり・要確認）",
  };

  return labels[eligibility] || "Unknown";
}
