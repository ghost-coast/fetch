const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5174;
const PUBLIC_DIR = path.join(__dirname, "public");
const TRANSPORT_WA = "https://www.transport.wa.gov.au";

const LOCATIONS = [
  {
    id: "albany",
    name: "Albany",
    region: "Western Australia",
    windStations: [
      { id: "albany", name: "Albany", station: "009500", bomId: "94801", distanceKm: 23.6 },
      {
        id: "walpole-north",
        name: "Walpole North",
        station: "095647",
        bomId: "95647",
        distanceKm: null,
      },
      { id: "shannon", name: "Shannon", station: "095617", bomId: "95617", distanceKm: null },
      {
        id: "windy-harbour",
        name: "Windy Harbour",
        station: "094640",
        bomId: "94640",
        distanceKm: null,
      },
    ],
    wave: {
      name: "Albany",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/albany`,
      height: "/getmedia/cbc71bb9-8e7d-4dba-b0da-da57afcf7c85/DWA_WAVE.GIF",
      direction: "/getmedia/75d2f4ff-140f-45fe-8be7-592501f67329/DWA_POLD.GIF",
    },
    tide: { name: "Albany", aac: "WA_TP001" },
  },
  {
    id: "bremer-bay",
    name: "Bremer Bay",
    region: "Western Australia",
    windStations: [
      { id: "jacup", name: "Jacup", station: "010917", bomId: "95636", distanceKm: 73.2 },
    ],
    wave: {
      name: "Bremer Bay",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/bremer-bay`,
      height: "/getmedia/ddc1d976-cffd-486a-b30e-fba3c72db9d7/BBO_WAVE.GIF",
      direction: "/getmedia/44983297-1fad-4e6b-a517-c5a6ced5cc76/BBO_POLD.GIF",
    },
    tide: { name: "Bremer Bay", aac: "WA_TP086" },
  },
  {
    id: "cape-naturaliste",
    name: "Margaret River",
    region: "Western Australia",
    windStations: [
      {
        id: "cape-naturaliste",
        name: "Cape Naturaliste",
        station: "009519",
        bomId: "94600",
        distanceKm: 23.7,
      },
      {
        id: "witchcliffe-west",
        name: "Witchcliffe West",
        station: "109521",
        bomId: "95641",
        distanceKm: 37.1,
      },
      {
        id: "cape-leeuwin",
        name: "Cape Leeuwin",
        station: "009518",
        bomId: "94601",
        distanceKm: 94.2,
      },
    ],
    wave: {
      name: "Cape Naturaliste",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/cape-naturaliste`,
      height: "/getmedia/010398a0-725f-4e04-9dc0-30bf9e978929/DWN_WAVE.GIF",
      direction: "/getmedia/d89b80f1-9411-400f-9b9e-1f1ede1c59b9/DWN_POLD.GIF",
    },
    tide: { name: "Cowaramup", aac: "WA_TP089" },
  },
  {
    id: "cottesloe",
    name: "Perth",
    region: "Western Australia",
    windStations: [
      {
        id: "swanbourne",
        name: "Swanbourne",
        station: "009215",
        bomId: "94614",
        distanceKm: 7.2,
      },
      {
        id: "melville-water",
        name: "Melville Water",
        station: "009091",
        bomId: "95620",
        distanceKm: 13.6,
      },
      {
        id: "hillarys-point-boat-harbour",
        name: "Hillarys Point Boat Harbour",
        station: "009265",
        bomId: "95605",
        distanceKm: 17.2,
      },
      {
        id: "rottnest-island",
        name: "Rottnest Island",
        station: "009193",
        bomId: "94602",
        distanceKm: 18.0,
      },
      {
        id: "armament-jetty",
        name: "Armament Jetty",
        station: "009254",
        bomId: "99254",
        distanceKm: 22.5,
      },
      {
        id: "colpoys-point",
        name: "Colpoys Point",
        station: "009255",
        bomId: "99255",
        distanceKm: 28.1,
      },
      {
        id: "garden-island",
        name: "Garden Island",
        station: "009256",
        bomId: "95607",
        distanceKm: 29.2,
      },
    ],
    wave: {
      name: "Cottesloe",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/cottesloe`,
      height: "/getmedia/06c45db9-c83b-4e87-9927-957f887da565/DWM_WAVE.GIF",
      direction: "/getmedia/12e11f65-3deb-470c-8043-8dd2f8405e26/DWM_POLD.GIF",
    },
    tide: { name: "Fremantle", aac: "WA_TP015" },
  },
  {
    id: "esperance",
    name: "Esperance",
    region: "Western Australia",
    windStations: [
      {
        id: "esperance-harbour",
        name: "Esperance Harbour",
        station: "009790",
        bomId: "95648",
        distanceKm: 23.4,
      },
      { id: "esperance", name: "Esperance", station: "009789", bomId: "94638", distanceKm: 19.0 },
    ],
    wave: {
      name: "Esperance",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/esperance`,
      height: "/getmedia/a16c3582-0a17-4e44-9c8d-87fb388cc763/DWE_WAVE.GIF",
      direction: "/getmedia/93e952f0-ffa5-49d2-8006-7c404e924c9d/DWE_POLD.GIF",
    },
    tide: { name: "Esperance", aac: "WA_TP013" },
  },
  {
    id: "geraldton",
    name: "Geraldton",
    region: "Western Australia",
    windStations: [
      {
        id: "geraldton-airport",
        name: "Geraldton Airport",
        station: "008051",
        bomId: "94403",
        distanceKm: 32.7,
      },
    ],
    wave: {
      name: "Geraldton",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/geraldton`,
      height: "/getmedia/6cd71be8-0761-4023-b04b-5e70184bc96b/GOW_WAVE.GIF",
      direction: "/getmedia/b5f1e536-484e-4b6f-9215-fd3f405bb4d6/GOW_POLD.GIF",
    },
    tide: { name: "Geraldton", aac: "WA_TP016" },
  },
  {
    id: "jurien-bay",
    name: "Jurien Bay",
    region: "Western Australia",
    windStations: [
      { id: "jurien-bay", name: "Jurien Bay", station: "009131", bomId: "95600", distanceKm: 11.3 },
    ],
    wave: {
      name: "Jurien Bay",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/jurien-bay`,
      height: "/getmedia/f4795fa4-b11c-463b-ba65-6431745905b3/DWJ_WAVE.GIF",
      direction: "/getmedia/35e72062-be34-49f9-8880-e082dcaa4dd2/DWJ_POLD.GIF",
    },
    tide: { name: "Jurien Bay Harbour", aac: "WA_TP147" },
  },
  {
    id: "mandurah",
    name: "Mandurah",
    region: "Western Australia",
    windStations: [
      { id: "mandurah", name: "Mandurah", station: "009977", bomId: "94605", distanceKm: 15.1 },
      {
        id: "garden-island",
        name: "Garden Island",
        station: "009256",
        bomId: "95607",
        distanceKm: 25.7,
      },
      {
        id: "colpoys-point",
        name: "Colpoys Point",
        station: "009255",
        bomId: "99255",
        distanceKm: 27.5,
      },
    ],
    wave: {
      name: "Mandurah",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/mandurah`,
      height: "/getmedia/a0e12f55-82b5-44ed-93e9-eaf457ffcced/MDW_WAVE.GIF",
      direction: "/getmedia/6747fef8-68f2-4932-b546-ef640df3628e/MDW_POLD.GIF",
    },
    tide: { name: "Mandurah Ocean Marina", aac: "WA_TP146" },
  },
  {
    id: "rottnest-island",
    name: "Rottnest Island",
    region: "Western Australia",
    windStations: [
      {
        id: "rottnest-island",
        name: "Rottnest Island",
        station: "009193",
        bomId: "94602",
        distanceKm: 14.0,
      },
      {
        id: "armament-jetty",
        name: "Armament Jetty",
        station: "009254",
        bomId: "99254",
        distanceKm: 27.1,
      },
      {
        id: "garden-island",
        name: "Garden Island",
        station: "009256",
        bomId: "95607",
        distanceKm: 30.0,
      },
    ],
    wave: {
      name: "Rottnest Island",
      source: `${TRANSPORT_WA}/marine/charts-warnings-current-conditions/coastal-data-charts/wave-data/rottnest-island`,
      height: "/getmedia/b3dfc548-cd46-4c32-aada-0261a3a66fc1/RDW_WAVE.GIF",
      direction: "/getmedia/70e0fe88-19fa-49fb-9094-d6c1bf148a01/RDW_POLD.GIF",
    },
    tide: { name: "Rottnest Island", aac: "WA_TP092" },
  },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function locationSummary(location) {
  return {
    id: location.id,
    name: location.name,
    region: location.region,
    windStations: location.windStations.map(({ name }) => name),
    waveSource: location.wave.source,
  };
}

function findLocation(id) {
  return LOCATIONS.find((location) => location.id === id);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Australia Buoy Winds Dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,text/plain,*/*",
      "user-agent": "Australia Buoy Winds Dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchImageModifiedTime(imageUrl) {
  const response = await fetch(imageUrl, {
    method: "HEAD",
    headers: {
      accept: "image/gif,image/*,*/*",
      "user-agent": "Australia Buoy Winds Dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const lastModified = response.headers.get("last-modified");
  if (!lastModified) return null;

  const date = new Date(lastModified);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\s/g, "")
    .toLowerCase();
}

async function proxyImage(res, imageUrl) {
  const response = await fetch(imageUrl, {
    headers: {
      accept: "image/gif,image/*,*/*",
      "user-agent": "Australia Buoy Winds Dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  res.writeHead(200, {
    "content-type": response.headers.get("content-type") || "image/gif",
    "cache-control": "no-store",
  });
  res.end(bytes);
}

function perthDateForBom() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    day: "2-digit",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date());
  const day = parts.find((part) => part.type === "day").value;
  const month = parts.find((part) => part.type === "month").value;
  const year = parts.find((part) => part.type === "year").value;
  return `${day}-${month}-${year}`;
}

function stripTags(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTideTable(html) {
  const days = [];
  const dayRegex = /<div class="tide-day[^"]*">([\s\S]*?)(?=<div class="tide-day|<\/div>\s*<\/div>)/gi;
  let dayMatch;

  while ((dayMatch = dayRegex.exec(html))) {
    const block = dayMatch[1];
    const day = stripTags(block.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1]);
    const tides = [];
    const tideRegex =
      /<th[^>]*class="instance [^"]*?(high|low)-tide"[^>]*>(High|Low)<\/th>\s*<td[^>]*data-time-local="([^"]+)"[^>]*>([\s\S]*?)<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*class="height [^"]*?(?:high|low)-tide"[^>]*>([\s\S]*?)<\/td>/gi;
    let tideMatch;

    while ((tideMatch = tideRegex.exec(block))) {
      tides.push({
        type: tideMatch[2],
        dateTime: tideMatch[3],
        time: stripTags(tideMatch[4]),
        heightM: Number(stripTags(tideMatch[5]).replace(" m", "")),
        height: stripTags(tideMatch[5]),
      });
    }

    if (day && tides.length) {
      days.push({ day, tides });
    }
  }

  return days;
}

function firstObservation(payload) {
  return payload?.observations?.data?.find((row) => row && row.local_date_time);
}

function normalizeObservation(station, row) {
  const hasDistance = typeof station.distanceKm === "number";
  const isWithinRadius = hasDistance && station.distanceKm <= 30;
  return {
    id: station.id,
    name: station.name,
    station: station.station,
    updated: row?.local_date_time_full || row?.local_date_time || null,
    displayTime: row?.local_date_time || null,
    windDir: row?.wind_dir || "-",
    windSpeedKmh: row?.wind_spd_kmh ?? null,
    windGustKmh: row?.gust_kmh ?? null,
    windSpeedKt: row?.wind_spd_kt ?? null,
    windGustKt: row?.gust_kt ?? null,
    distanceKm: station.distanceKm ?? null,
    proximityLabel:
      station.distanceKm === null
        ? "Regional BOM wind station"
        : isWithinRadius
          ? "Within 30 km of buoy"
          : "Nearest BOM wind station",
    isWithin10km: hasDistance && station.distanceKm <= 10,
    isWithinRadius,
    source: `https://www.bom.gov.au/products/IDW60801/IDW60801.${station.bomId}.shtml`,
  };
}

async function getLocationData(location) {
  const stations = await Promise.all(
    location.windStations.map(async (station) => {
      const url = `https://www.bom.gov.au/fwo/IDW60801/IDW60801.${station.bomId}.json`;
      const payload = await fetchJson(url);
      const row = firstObservation(payload);
      if (!row) throw new Error(`No observations for ${station.name}`);
      return normalizeObservation(station, row);
    }),
  );

  const tide = await getTideData(location).catch((error) => ({
    name: location.tide.name,
    error: error.message,
    days: [],
  }));
  const waveDisplayTime = await fetchImageModifiedTime(`${TRANSPORT_WA}${location.wave.direction}`).catch(() => null);

  return {
    issuedAt: new Date().toISOString(),
    location: locationSummary(location),
    stations,
    wave: {
      name: location.wave.name,
      displayTime: waveDisplayTime,
      heightImageUrl: `/api/wave-image?location=${encodeURIComponent(location.id)}&type=height`,
      directionImageUrl: `/api/wave-image?location=${encodeURIComponent(location.id)}&type=direction`,
      source: location.wave.source,
    },
    tide,
  };
}

async function getTideData(location) {
  const query = new URLSearchParams({
    type: "tide",
    aac: location.tide.aac,
    date: perthDateForBom(),
    days: "2",
    region: "WA",
    offset: "0",
    offsetName: "",
    tz: "Australia/Perth",
    tz_js: "AWST",
  });
  const tableUrl = `https://www.bom.gov.au/australia/tides/scripts/getTidesTable.php?${query}`;
  const tableHtml = await fetchText(tableUrl);

  return {
    name: location.tide.name,
    source: "https://www.bom.gov.au/australia/tides/",
    days: parseTideTable(tableHtml),
  };
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/locations") {
      sendJson(res, 200, {
        issuedAt: new Date().toISOString(),
        locations: LOCATIONS.map(locationSummary),
      });
      return;
    }

    if (url.pathname.startsWith("/api/location/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/location/", ""));
      const location = findLocation(id);
      if (!location) {
        sendError(res, 404, "Location not found");
        return;
      }
      sendJson(res, 200, await getLocationData(location));
      return;
    }

    if (url.pathname === "/api/wave-image") {
      const location = findLocation(url.searchParams.get("location"));
      if (!location) {
        sendError(res, 404, "Location not found");
        return;
      }
      const type = url.searchParams.get("type");
      const imagePath = type === "direction" ? location.wave.direction : location.wave.height;
      await proxyImage(res, `${TRANSPORT_WA}${imagePath}`);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendError(res, 502, error.message || "Unable to retrieve live data");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Buoy winds dashboard running at http://127.0.0.1:${PORT}`);
});
