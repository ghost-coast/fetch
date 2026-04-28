const pageTitle = document.querySelector("#page-title");
const homeLink = document.querySelector("#home-link");
const homeView = document.querySelector("#home-view");
const detailView = document.querySelector("#detail-view");
const locationGrid = document.querySelector("#location-grid");
const windGrid = document.querySelector("#wind-grid");
const statusEl = document.querySelector("#status");
const refreshButton = document.querySelector("#refresh");
const buoyImage = document.querySelector("#buoy-image");
const swellDirectionImage = document.querySelector("#swell-direction-image");
const tideChart = document.querySelector("#tide-chart");
const waveStats = document.querySelector("#wave-stats");

let locations = [];
let activeLocationId = new URLSearchParams(window.location.search).get("location");

const COMPASS_DEGREES = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

const OFFSHORE_SECTORS = {
  albany: [{ from: 300, to: 60 }],
  "bremer-bay": [{ from: 300, to: 60 }],
  "cape-naturaliste": [{ from: 35, to: 145 }],
  cottesloe: [{ from: 35, to: 145 }],
  esperance: [{ from: 300, to: 60 }],
  geraldton: [{ from: 35, to: 145 }],
  "jurien-bay": [{ from: 35, to: 145 }],
  mandurah: [{ from: 35, to: 145 }],
  "rottnest-island": [{ from: 35, to: 145 }],
};

function value(value, suffix = "") {
  if (value === null || value === undefined || value === "" || value === "-") return "-";
  return `${value}${suffix}`;
}

function formatObservationTime(raw) {
  if (!raw) return "-";
  return raw;
}

function formatCompactObservationTime(raw) {
  return formatObservationTime(raw).replace(/^\d+\//, "");
}

function formatBuoyName(name) {
  if (!name) return "";
  return /\bbuoy\b/i.test(name) ? name : `${name} Buoy`;
}

function withCacheBuster(url) {
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function imageLoaded(image) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", reject, { once: true });
  });
}

function formatDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isBearingInSector(bearing, sector) {
  if (sector.from <= sector.to) {
    return bearing >= sector.from && bearing <= sector.to;
  }

  return bearing >= sector.from || bearing <= sector.to;
}

function getWindDirectionState(direction) {
  const bearing = COMPASS_DEGREES[direction?.toUpperCase()];
  const sectors = OFFSHORE_SECTORS[activeLocationId];

  if (bearing === undefined || !sectors) {
    return { className: "direction-neutral", label: "Wind direction" };
  }

  const isOffshore = sectors.some((sector) => isBearingInSector(bearing, sector));

  return isOffshore
    ? { className: "direction-offshore", label: "Offshore wind direction" }
    : { className: "direction-onshore", label: "Not offshore wind direction" };
}

function getImagePixels(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);

  return {
    width: canvas.width,
    height: canvas.height,
    data: context.getImageData(0, 0, canvas.width, canvas.height).data,
  };
}

function isSeaPixel(red, green, blue) {
  const greenSea = green > 95 && red < 90 && blue < 90;
  const blueSea = blue > 105 && green > 60 && red < 90 && blue > green + 20;
  return greenSea || blueSea;
}

function isSwellPixel(red, green, blue) {
  const redSwell = red > 145 && green < 100 && blue < 100;
  const mauveSwell = red > 120 && red < 190 && green > 80 && green < 150 && blue > 95 && blue < 175 && red > green + 12;
  return redSwell || mauveSwell;
}

function isSeaDirectionPixel(red, green, blue) {
  return isSeaPixel(red, green, blue);
}

function isSwellDirectionPixel(red, green, blue) {
  return isSwellPixel(red, green, blue);
}

function findLatestGraphValue(pixels, plot, colorTest, maxValue) {
  const { data, width } = pixels;
  const points = [];

  for (let y = plot.yMin; y <= plot.yMax; y += 1) {
    for (let x = plot.xMin; x <= plot.xMax; x += 1) {
      const index = (y * width + x) * 4;
      if (colorTest(data[index], data[index + 1], data[index + 2])) {
        points.push({ x, y });
      }
    }
  }

  if (!points.length) return null;

  const latestX = Math.max(...points.map((point) => point.x));
  const latestPoints = points.filter((point) => point.x >= latestX - 4);
  const averageY = latestPoints.reduce((sum, point) => sum + point.y, 0) / latestPoints.length;
  const value = ((plot.yMax - averageY) / (plot.yMax - plot.yMin)) * maxValue;

  return Math.max(0, value);
}

function findColoredComponents(pixels, colorTest) {
  const { data, width } = pixels;
  const target = new Set();

  for (let y = 80; y < pixels.height - 28; y += 1) {
    for (let x = 38; x < width - 78; x += 1) {
      const index = (y * width + x) * 4;
      if (colorTest(data[index], data[index + 1], data[index + 2])) {
        target.add(`${x},${y}`);
      }
    }
  }

  const seen = new Set();
  const components = [];
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];

  for (const key of target) {
    if (seen.has(key)) continue;

    const queue = [key];
    const points = [];
    seen.add(key);

    while (queue.length) {
      const current = queue.shift();
      const [x, y] = current.split(",").map(Number);
      points.push({ x, y });

      for (const [dx, dy] of offsets) {
        const next = `${x + dx},${y + dy}`;
        if (target.has(next) && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }

    if (points.length >= 12) {
      components.push(points);
    }
  }

  return components.sort((a, b) => b.length - a.length);
}

const LEGEND_DIGITS = {
  "..####.\n.#...#.\n.#....#\n#.....#\n#.....#\n#.....#\n.#....#\n.#...#.\n..####.": "0",
  "..####.\n.#...##\n.#....#\n##....#\n##....#\n##....#\n.#....#\n.#...##\n..####.": "0",
  ".####.\n#...##\n#....#\n#....#\n#....#\n#....#\n#....#\n#...##\n.####.": "0",
  ".#####.\n.#...#.\n##...##\n##...##\n##...##\n##...##\n##...##\n.#...#.\n.#####.": "0",
  "..##.\n####.\n..##.\n..##.\n..##.\n..##.\n..##.\n..##.\n#####": "1",
  "..#..\n###..\n..#..\n..#..\n..#..\n..#..\n..#..\n..#..\n#####": "1",
  "#####.\n....##\n....##\n....##\n....##\n...##.\n..##..\n.##...\n######": "2",
  "#####..\n#...##.\n.....#.\n....##.\n..###..\n.....##\n.....##\n.....#.\n#####..": "3",
  "######.\n#...##.\n.....##\n....##.\n..###..\n.....##\n.....##\n#....##\n#####..": "3",
  "....##.\n...###.\n..#.##.\n.##.##.\n.#..##.\n#...##.\n#######\n....##.\n....##.": "4",
  ".#####.\n.#.....\n.#.....\n.####..\n.....#.\n.....##\n.....##\n#....#.\n#####..": "5",
  "######\n##....\n##....\n#####.\n....##\n.....#\n.....#\n....##\n#####.": "5",
  "#####.\n#.....\n#.....\n####..\n....#.\n....##\n....##\n....#.\n####..": "5",
  "#######\n##.....\n##.....\n######.\n....###\n.....##\n.....##\n#...##.\n#####..": "5",
  "..###.\n.#....\n#.....\n#####.\n#...#.\n#....#\n#....#\n#...#.\n.###..": "6",
  "..####\n.#....\n##....\n#####.\n#...##\n#....#\n#....#\n##..##\n.####.": "6",
  "..####.\n.##....\n##.....\n######.\n##...##\n##...##\n##...##\n.#...##\n..####.": "6",
  "######\n....#.\n....#.\n...#..\n..##..\n..#...\n.##...\n.#....\n##....": "7",
  "######\n....##\n....##\n...##.\n..##..\n..##..\n.##...\n.##...\n##....": "7",
  "#######\n.....##\n....##.\n....##.\n...##..\n...#...\n..##...\n..#....\n.##....": "7",
  "#####..\n#...##.\n.....##\n.....##\n....##.\n...###.\n..###..\n.###...\n#######": "2",
  ".#####.\n.....##\n.....##\n.....##\n...##..\n.....##\n.....##\n#....##\n######.": "3",
  "..###..\n.#...#.\n.#....#\n.#...#.\n..####.\n.#...##\n#.....#\n##...#.\n..###..": "8",
  "..####.\n.#...##\n##...##\n.#...#.\n..####.\n##...##\n#.....#\n##...##\n.#####.": "8",
  "..####.\n.##..##\n.#....#\n.##..##\n..####.\n.#...##\n##....#\n##...##\n..####.": "8",
  "..###..\n##...#.\n#....#.\n#....##\n##...##\n.#####.\n.....#.\n....##.\n.###...": "9",
  "..###..\n.#...#.\n#....#.\n#.....#\n.#....#\n.#####.\n.....#.\n....##.\n.###...": "9",
  ".####..\n##..##.\n##...##\n##...##\n##...##\n.######\n.....#.\n....##.\n.####..": "9",
};

function getLegendComponents(pixels, colorTest, yMin, yMax) {
  const { data, width } = pixels;
  const target = new Set();

  for (let y = yMin; y <= yMax; y += 1) {
    for (let x = 70; x <= 104; x += 1) {
      const index = (y * width + x) * 4;
      if (colorTest(data[index], data[index + 1], data[index + 2])) {
        target.add(`${x},${y}`);
      }
    }
  }

  const seen = new Set();
  const components = [];
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];

  for (const key of target) {
    if (seen.has(key)) continue;

    const queue = [key];
    const points = [];
    seen.add(key);

    while (queue.length) {
      const current = queue.shift();
      const [x, y] = current.split(",").map(Number);
      points.push({ x, y });

      for (const [dx, dy] of offsets) {
        const next = `${x + dx},${y + dy}`;
        if (target.has(next) && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    components.push({
      points,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    });
  }

  const sortedComponents = components
    .filter((component) => component.points.length >= 3)
    .sort((a, b) => a.minX - b.minX);
  const merged = [];

  for (const component of sortedComponents) {
    const previous = merged[merged.length - 1];
    const closeFragment = previous && component.minX - previous.maxX <= 2 && component.maxY - component.minY > 3;

    if (closeFragment) {
      previous.points = [...previous.points, ...component.points];
      previous.minX = Math.min(previous.minX, component.minX);
      previous.maxX = Math.max(previous.maxX, component.maxX);
      previous.minY = Math.min(previous.minY, component.minY);
      previous.maxY = Math.max(previous.maxY, component.maxY);
    } else {
      merged.push(component);
    }
  }

  return merged;
}

function componentSignature(component) {
  const pointSet = new Set(component.points.map((point) => `${point.x},${point.y}`));
  const rows = [];

  for (let y = component.minY; y <= component.maxY; y += 1) {
    let row = "";
    for (let x = component.minX; x <= component.maxX; x += 1) {
      row += pointSet.has(`${x},${y}`) ? "#" : ".";
    }
    rows.push(row);
  }

  return rows.join("\n");
}

function readLegendGlyphAt(pixels, colorTest, box) {
  const { data, width } = pixels;
  const points = [];

  for (let y = box.yMin; y <= box.yMax; y += 1) {
    for (let x = box.xMin; x <= box.xMax; x += 1) {
      const index = (y * width + x) * 4;
      if (colorTest(data[index], data[index + 1], data[index + 2])) {
        points.push({ x, y });
      }
    }
  }

  if (!points.length) return "";

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return (
    LEGEND_DIGITS[
      componentSignature({
        points,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      })
    ] || ""
  );
}

function readFixedLegendHeight(pixels, colorTest, yMin, yMax) {
  const boxes = [
    { xMin: 73, xMax: 81, yMin, yMax },
    { xMin: 88, xMax: 94, yMin, yMax },
    { xMin: 96, xMax: 103, yMin, yMax },
  ];
  const digits = boxes.map((box) => readLegendGlyphAt(pixels, colorTest, box));

  if (digits.some((digit) => !digit)) return null;
  return Number(`${digits[0]}.${digits[1]}${digits[2]}`);
}

function readLegendHeight(pixels, colorTest, yMin, yMax) {
  const characters = getLegendComponents(pixels, colorTest, yMin, yMax)
    .map((component) => {
      const width = component.maxX - component.minX + 1;
      const height = component.maxY - component.minY + 1;

      if (width <= 2 && height <= 2) return ".";
      return LEGEND_DIGITS[componentSignature(component)] || "";
    })
    .join("");

  const match = characters.match(/\d+\.\d+/);
  if (match) return Number(match[0]);

  const fixedValue = readFixedLegendHeight(pixels, colorTest, yMin, yMax);
  return fixedValue !== null && !Number.isNaN(fixedValue) ? fixedValue : null;
}

function findPolarWaveObservation(pixels, colorTest) {
  const { width } = pixels;
  const center = { x: Math.round(width / 2), y: Math.round(pixels.height / 2) };
  const maxPeriodRadius = Math.min(pixels.width, pixels.height) * 0.382;
  const arrow = findColoredComponents(pixels, colorTest)
    .map((component) => {
      const distances = component.map((point) => Math.hypot(point.x - center.x, point.y - center.y));
      const minDistance = Math.min(...distances);
      const maxDistance = Math.max(...distances);
      const span = maxDistance - minDistance;
      return { component, minDistance, maxDistance, span };
    })
    .filter(
      ({ minDistance, maxDistance, span }) =>
        maxDistance > 25 && minDistance < maxPeriodRadius * 1.35 && span >= 25,
    )
    .sort((a, b) => b.span - a.span || a.component.length - b.component.length)[0]?.component;

  if (!arrow) return { direction: "-", periodSec: null };

  const arrowPoint = arrow.reduce((closest, point) => {
    const distance = Math.hypot(point.x - center.x, point.y - center.y);
    if (distance < 25) return closest;
    if (!closest || distance < closest.distance) return { ...point, distance };
    return closest;
  }, null);

  if (!arrowPoint) return { direction: "-", periodSec: null };

  const bearing = (Math.atan2(arrowPoint.x - center.x, center.y - arrowPoint.y) * 180) / Math.PI;
  const periodSec = Math.min(20, Math.max(0, (arrowPoint.distance / maxPeriodRadius) * 20));

  return {
    direction: degreesToCompass((bearing + 360) % 360),
    periodSec,
  };
}

function degreesToCompass(degrees) {
  const directions = Object.keys(COMPASS_DEGREES);
  const index = Math.round(degrees / 22.5) % directions.length;
  return directions[index];
}

function formatMetric(value, digits = 1) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(digits);
}

function showHome() {
  activeLocationId = null;
  pageTitle.textContent = "";
  homeView.hidden = false;
  detailView.hidden = true;
  homeLink.hidden = true;
  refreshButton.hidden = true;
  window.history.replaceState({}, "", "/");
  renderLocations();
}

function showLocation(id) {
  activeLocationId = id;
  homeView.hidden = true;
  detailView.hidden = false;
  homeLink.hidden = false;
  refreshButton.hidden = false;
  window.history.replaceState({}, "", `/?location=${encodeURIComponent(id)}`);
  loadLocation(id);
}

function renderLocations() {
  locationGrid.innerHTML = locations
    .map(
      (location) => `
        <a class="location-card" href="/?location=${encodeURIComponent(location.id)}" data-location="${location.id}">
          <div class="location-copy">
            <strong>${location.name}</strong>
          </div>
          <span class="card-arrow" aria-hidden="true">&rsaquo;</span>
        </a>
      `,
    )
    .join("");
}

function renderWind(stations) {
  if (!stations.length) {
    windGrid.innerHTML = '<p class="error">No coastal BOM wind stations are available for this buoy.</p>';
    return;
  }

  windGrid.innerHTML = stations
    .map((station) => {
      const directionState = getWindDirectionState(station.windDir);
      return `
        <article class="wind-card">
          <div class="station-block">
            <h3><a class="station-link" href="${station.source}" target="_blank" rel="noopener noreferrer">${station.name}</a></h3>
            <p class="station-id">${formatCompactObservationTime(station.displayTime)}</p>
          </div>
          <dl class="wind-metrics">
            <div class="primary-metric">
              <dt>Wind</dt>
              <dd>${value(station.windSpeedKt)}<span>kt</span></dd>
            </div>
            <div class="primary-metric">
              <dt>Gust</dt>
              <dd>${value(station.windGustKt)}<span>kt</span></dd>
            </div>
          </dl>
          <div class="direction ${directionState.className}" title="${directionState.label}">${station.windDir}</div>
        </article>
      `;
    })
    .join("");
}

function renderLoadingCards() {
  windGrid.innerHTML = [1, 2, 3]
    .map(
      () => `
        <article class="wind-card loading-card" aria-hidden="true">
          <div class="station-block">
            <span class="skeleton skeleton-title"></span>
            <span class="skeleton skeleton-time"></span>
          </div>
          <dl class="wind-metrics">
            <div><span class="skeleton skeleton-metric"></span></div>
            <div><span class="skeleton skeleton-metric"></span></div>
          </dl>
          <span class="skeleton skeleton-direction"></span>
        </article>
      `,
    )
    .join("");
  tideChart.innerHTML = '<p class="station-id">Loading tides...</p>';
  waveStats.innerHTML = '<p class="station-id">Reading live wave charts...</p>';
}

function renderTideChart(tide) {
  if (!tide || tide.error || !tide.days?.length) {
    tideChart.innerHTML = '<p class="error">Tide predictions are not available for this location.</p>';
    return;
  }

  const today = tide.days[0];
  const highs = today.tides
    .filter((entry) => entry.type === "High")
    .sort((a, b) => b.heightM - a.heightM)
    .slice(0, 2);
  const lows = today.tides
    .filter((entry) => entry.type === "Low")
    .sort((a, b) => a.heightM - b.heightM)
    .slice(0, 2);
  const tidePoints = [...highs, ...lows].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
  );

  if (!tidePoints.length) {
    tideChart.innerHTML = '<p class="error">No tide points are available for today.</p>';
    return;
  }

  tideChart.innerHTML = `
    <div class="tide-meta">
      <div class="meta-title">
        <strong>
          <a class="meta-link" href="${tide.source}" target="_blank" rel="noopener noreferrer">${tide.name} Tide</a>
        </strong>
      </div>
    </div>
    <div class="tide-readings">
      ${tidePoints
        .map(
          (entry) => `
            <div>
              <span>${entry.type}</span>
              <strong>${entry.time}</strong>
              <em>${entry.height}</em>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderWaveStats(stats) {
  if (!stats) {
    waveStats.innerHTML = '<p class="error">Sea and swell observations are not available.</p>';
    return;
  }

  waveStats.innerHTML = `
    <div class="tide-meta">
      <div class="meta-title">
        <strong>
          <a class="meta-link" href="${stats.source}" target="_blank" rel="noopener noreferrer">${formatBuoyName(stats.name)}</a>
        </strong>
      </div>
      ${stats.displayTime ? `<span class="meta-time">${formatCompactObservationTime(stats.displayTime)}</span>` : ""}
    </div>
    <div class="wave-stat-grid">
      ${[
        { label: "Swell", data: stats.swell },
        { label: "Sea", data: stats.sea },
      ]
        .map(
          ({ label, data }) => `
            <article class="wave-stat-card">
              <div class="station-block">
                <h3>${label}</h3>
              </div>
              <dl class="wind-metrics wave-metrics">
                <div>
                  <dt>Height</dt>
                  <dd>${formatMetric(data.heightM, 2)}<span>m</span></dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>${formatMetric(data.periodSec, 0)}<span>s</span></dd>
                </div>
              </dl>
              <div class="direction direction-neutral" title="${label} direction">${data.direction}</div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

async function readWaveStats() {
  await Promise.all([imageLoaded(buoyImage), imageLoaded(swellDirectionImage)]);

  const heightPixels = getImagePixels(buoyImage);
  const directionPixels = getImagePixels(swellDirectionImage);
  const heightPlot = { xMin: 42, xMax: 428, yMin: 27, yMax: 136 };
  const periodPlot = { xMin: 42, xMax: 428, yMin: 174, yMax: 300 };
  const seaHeight = readLegendHeight(directionPixels, isSeaPixel, 24, 38);
  const swellHeight = readLegendHeight(directionPixels, isSwellPixel, 42, 56);
  const seaObservation = findPolarWaveObservation(directionPixels, isSeaDirectionPixel);
  const swellObservation = findPolarWaveObservation(directionPixels, isSwellDirectionPixel);

  return {
    name: swellDirectionImage.dataset.buoyName || "",
    displayTime: swellDirectionImage.dataset.displayTime || "",
    source: swellDirectionImage.dataset.source || "",
    sea: {
      heightM: seaHeight ?? findLatestGraphValue(heightPixels, heightPlot, isSeaPixel, 5),
      periodSec: seaObservation.periodSec ?? findLatestGraphValue(heightPixels, periodPlot, isSeaPixel, 16),
      direction: seaObservation.direction,
    },
    swell: {
      heightM: swellHeight ?? findLatestGraphValue(heightPixels, heightPlot, isSwellPixel, 5),
      periodSec: swellObservation.periodSec ?? findLatestGraphValue(heightPixels, periodPlot, isSwellPixel, 16),
      direction: swellObservation.direction,
    },
  };
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadLocations() {
  statusEl.textContent = "Loading locations...";
  const data = await getJson("/api/locations");
  locations = data.locations;
  renderLocations();
  statusEl.textContent = "";
}

async function loadLocation(id) {
  refreshButton.disabled = true;
  statusEl.textContent = "Refreshing live data...";
  renderLoadingCards();

  try {
    const data = await getJson(`/api/location/${encodeURIComponent(id)}`);
    const { location, wave, stations } = data;
    pageTitle.textContent = location.name;
    buoyImage.dataset.buoyName = wave.name || "";
    swellDirectionImage.dataset.buoyName = wave.name || "";
    buoyImage.dataset.displayTime = wave.displayTime || "";
    swellDirectionImage.dataset.displayTime = wave.displayTime || "";
    buoyImage.dataset.source = wave.source || "";
    swellDirectionImage.dataset.source = wave.source || "";
    waveStats.innerHTML = '<p class="station-id">Reading live wave charts...</p>';
    buoyImage.src = withCacheBuster(wave.heightImageUrl);
    swellDirectionImage.src = withCacheBuster(wave.directionImageUrl);
    renderWind(stations);
    renderTideChart(data.tide);
    statusEl.textContent = formatDisplayDate();
    renderWaveStats(await readWaveStats());
  } catch (error) {
    statusEl.textContent = "Live data could not be loaded.";
    windGrid.innerHTML = `<p class="error">${error.message}</p>`;
    waveStats.innerHTML = '<p class="error">Sea and swell observations are not available.</p>';
  } finally {
    refreshButton.disabled = false;
  }
}

locationGrid.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-location]");
  if (!link) return;
  event.preventDefault();
  showLocation(link.dataset.location);
});

homeLink.addEventListener("click", (event) => {
  event.preventDefault();
  showHome();
});

refreshButton.addEventListener("click", () => {
  if (activeLocationId) {
    loadLocation(activeLocationId);
  } else {
    loadLocations();
  }
});

window.addEventListener("popstate", () => {
  const id = new URLSearchParams(window.location.search).get("location");
  if (id) {
    showLocation(id);
  } else {
    showHome();
  }
});

loadLocations()
  .then(() => {
    if (activeLocationId) {
      showLocation(activeLocationId);
    } else {
      showHome();
    }
  })
  .catch((error) => {
    statusEl.textContent = "Locations could not be loaded.";
    locationGrid.innerHTML = `<p class="error">${error.message}</p>`;
  });

setInterval(() => {
  if (activeLocationId) {
    loadLocation(activeLocationId);
  }
}, 10 * 60 * 1000);
