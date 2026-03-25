// Google Maps POI search setup and controls
(() => {
  let map;
  let placesService;
  let referencePin = null;
  let poiMarkers = [];
  let geocoder = null;

  const ui = {};
  const POI_TYPE_PLACEHOLDER = "Select POI categories";
  const SELECT_ALL_VALUE = "__all";
  const DEFAULT_STATE_KEY = "ontario";
  const DEFAULT_CITY_KEY = "waterloo";
  const REQUIRED_IMPORT_FIELDS = [
    "Subject site address",
    "Subject site city",
    "Subject site province",
  ];

  // Minimal map style that hides POI icons, road labels, place names, transit labels, and natural feature labels while keeping administrative boundaries visible
  const mapStyles = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.country",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.province",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "administrative.neighborhood",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "water",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "landscape.natural",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit.line",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ visibility: "on" }, { color: "#ffa726" }, { weight: 1.5 }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ visibility: "on" }, { color: "#c1c7ca" }, { weight: 1 }],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.text",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#f1bcbc" }, { weight: 0.5 }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text",
      stylers: [{ visibility: "on" }],
    },

    // Carreteras principales
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ visibility: "on" }, { color: "#ffa726" }, { weight: 1.6 }],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },

    // Arteriales
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ visibility: "on" }, { color: "#c1c7ca" }, { weight: 1.2 }],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.text",
      stylers: [{ visibility: "on" }],
    },

    // Calles locales más discretas
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#e0e0e0" }, { weight: 0.6 }],
    },

    // Agua sin etiquetas
    {
      featureType: "water",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    // {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
    // {featureType: 'road.arterial', elementType: 'labels', stylers: [{visibility: 'off'}]},
    // {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'off'}]}
  ];

  const poiTypeLabels = {
    bank: "Bank",
    atm: "ATM",
    pharmacy: "Pharmacy",
    restaurant: "Restaurant",
    bar: "Bar",
    coffee: "Coffee",
    bakery: "Bakery",
    park: "Parks",
    liquor_store: "Liquor Store",
    // grocery_or_supermarket: 'Grocery or Supermarket',
    supermarket: "Supermarket",
    grocery: "Grocery",
    store: "Retailer",
    shopping_mall: "Shopping Mall",
    bus_station: "Bus Station",
    subway_station: "Subway Station",
    train_station: "Train Station",
    transit_station: "Transit Station",
    gym: "Gym",
    stadium: "Stadium",
    sports: "Sport Center",
    recreation_center: "Recreation Center",
  };

  const locationOptions = {
    alberta: {
      label: "Alberta",
      center: { lat: 53.9333, lng: -116.5765 },
      zoom: 6,
      cities: {
        calgary: {
          label: "Calgary",
          center: { lat: 51.0447, lng: -114.0719 },
          zoom: 12,
        },
        edmonton: {
          label: "Edmonton",
          center: { lat: 53.5461, lng: -113.4938 },
          zoom: 12,
        },
        redDeer: {
          label: "Red Deer",
          center: { lat: 52.2681, lng: -113.8112 },
          zoom: 12,
        },
        lethbridge: {
          label: "Lethbridge",
          center: { lat: 49.6956, lng: -112.8451 },
          zoom: 12,
        },
        medicineHat: {
          label: "Medicine Hat",
          center: { lat: 50.0405, lng: -110.6766 },
          zoom: 12,
        },
        grandePrairie: {
          label: "Grande Prairie",
          center: { lat: 55.1707, lng: -118.794 },
          zoom: 12,
        },
      },
    },
    britishColumbia: {
      label: "British Columbia",
      center: { lat: 53.7267, lng: -127.6476 },
      zoom: 5,
      cities: {
        vancouver: {
          label: "Vancouver",
          center: { lat: 49.2827, lng: -123.1207 },
          zoom: 12,
        },
        victoria: {
          label: "Victoria",
          center: { lat: 48.4284, lng: -123.3656 },
          zoom: 12,
        },
        kelowna: {
          label: "Kelowna",
          center: { lat: 49.888, lng: -119.496 },
          zoom: 12,
        },
        surrey: {
          label: "Surrey",
          center: { lat: 49.1913, lng: -122.849 },
          zoom: 12,
        },
        nanaimo: {
          label: "Nanaimo",
          center: { lat: 49.1659, lng: -123.9401 },
          zoom: 12,
        },
        kamloops: {
          label: "Kamloops",
          center: { lat: 50.6745, lng: -120.3273 },
          zoom: 12,
        },
      },
    },
    manitoba: {
      label: "Manitoba",
      center: { lat: 53.7609, lng: -98.8139 },
      zoom: 6,
      cities: {
        winnipeg: {
          label: "Winnipeg",
          center: { lat: 49.8954, lng: -97.1385 },
          zoom: 12,
        },
        brandon: {
          label: "Brandon",
          center: { lat: 49.8485, lng: -99.9501 },
          zoom: 12,
        },
        thompson: {
          label: "Thompson",
          center: { lat: 55.7433, lng: -97.8558 },
          zoom: 10,
        },
      },
    },
    newBrunswick: {
      label: "New Brunswick",
      center: { lat: 46.5653, lng: -66.4619 },
      zoom: 7,
      cities: {
        fredericton: {
          label: "Fredericton",
          center: { lat: 45.9636, lng: -66.6431 },
          zoom: 12,
        },
        moncton: {
          label: "Moncton",
          center: { lat: 46.0878, lng: -64.7782 },
          zoom: 12,
        },
        saintJohn: {
          label: "Saint John",
          center: { lat: 45.2733, lng: -66.0633 },
          zoom: 12,
        },
      },
    },
    newfoundlandAndLabrador: {
      label: "Newfoundland and Labrador",
      center: { lat: 53.1355, lng: -57.6604 },
      zoom: 5,
      cities: {
        stJohns: {
          label: "St. John's",
          center: { lat: 47.5615, lng: -52.7126 },
          zoom: 12,
        },
        cornerBrook: {
          label: "Corner Brook",
          center: { lat: 48.951, lng: -57.9484 },
          zoom: 11,
        },
        gander: {
          label: "Gander",
          center: { lat: 48.9567, lng: -54.6087 },
          zoom: 11,
        },
      },
    },
    novaScotia: {
      label: "Nova Scotia",
      center: { lat: 44.682, lng: -63.7443 },
      zoom: 7,
      cities: {
        halifax: {
          label: "Halifax",
          center: { lat: 44.6488, lng: -63.5752 },
          zoom: 12,
        },
        sydney: {
          label: "Sydney",
          center: { lat: 46.1368, lng: -60.1942 },
          zoom: 12,
        },
        truro: {
          label: "Truro",
          center: { lat: 45.3658, lng: -63.2867 },
          zoom: 13,
        },
      },
    },
    northwestTerritories: {
      label: "Northwest Territories",
      center: { lat: 64.8255, lng: -124.8457 },
      zoom: 4,
      cities: {
        yellowknife: {
          label: "Yellowknife",
          center: { lat: 62.454, lng: -114.3718 },
          zoom: 11,
        },
        inuvik: {
          label: "Inuvik",
          center: { lat: 68.3607, lng: -133.723 },
          zoom: 9,
        },
        hayRiver: {
          label: "Hay River",
          center: { lat: 60.8156, lng: -115.7997 },
          zoom: 10,
        },
      },
    },
    nunavut: {
      label: "Nunavut",
      center: { lat: 70.2998, lng: -83.1076 },
      zoom: 4,
      cities: {
        iqaluit: {
          label: "Iqaluit",
          center: { lat: 63.7467, lng: -68.5168 },
          zoom: 11,
        },
        rankinInlet: {
          label: "Rankin Inlet",
          center: { lat: 62.8114, lng: -92.0853 },
          zoom: 9,
        },
        cambridgeBay: {
          label: "Cambridge Bay",
          center: { lat: 69.1169, lng: -105.059 },
          zoom: 9,
        },
      },
    },
    ontario: {
      label: "Ontario",
      center: { lat: 50.0007, lng: -85.0012 },
      zoom: 6,
      cities: {
        toronto: {
          label: "Toronto",
          center: { lat: 43.6532, lng: -79.3832 },
          zoom: 12,
        },
        scarborough: {
          label: "Scarborough",
          center: { lat: 43.7731, lng: -79.2578 },
          zoom: 13,
        },
        ottawa: {
          label: "Ottawa",
          center: { lat: 45.4215, lng: -75.6972 },
          zoom: 12,
        },
        waterloo: {
          label: "Waterloo",
          center: { lat: 43.4643, lng: -80.5204 },
          zoom: 13,
        },
        mississauga: {
          label: "Mississauga",
          center: { lat: 43.589, lng: -79.6441 },
          zoom: 12,
        },
        hamilton: {
          label: "Hamilton",
          center: { lat: 43.2557, lng: -79.8711 },
          zoom: 12,
        },
        london: {
          label: "London",
          center: { lat: 42.9849, lng: -81.2453 },
          zoom: 12,
        },
        windsor: {
          label: "Windsor",
          center: { lat: 42.3149, lng: -83.0364 },
          zoom: 12,
        },
      },
    },
    princeEdwardIsland: {
      label: "Prince Edward Island",
      center: { lat: 46.5107, lng: -63.4168 },
      zoom: 7,
      cities: {
        charlottetown: {
          label: "Charlottetown",
          center: { lat: 46.2382, lng: -63.1311 },
          zoom: 12,
        },
        summerside: {
          label: "Summerside",
          center: { lat: 46.3933, lng: -63.7901 },
          zoom: 12,
        },
        montague: {
          label: "Montague",
          center: { lat: 46.164, lng: -62.6487 },
          zoom: 13,
        },
      },
    },
    quebec: {
      label: "Quebec",
      center: { lat: 52.9399, lng: -73.5491 },
      zoom: 6,
      cities: {
        montreal: {
          label: "Montreal",
          center: { lat: 45.5017, lng: -73.5673 },
          zoom: 12,
        },
        quebecCity: {
          label: "Quebec City",
          center: { lat: 46.8139, lng: -71.208 },
          zoom: 12,
        },
        gatineau: {
          label: "Gatineau",
          center: { lat: 45.4765, lng: -75.7013 },
          zoom: 12,
        },
        sherbrooke: {
          label: "Sherbrooke",
          center: { lat: 45.4042, lng: -71.8929 },
          zoom: 12,
        },
        troisRivieres: {
          label: "Trois-Rivières",
          center: { lat: 46.343, lng: -72.545 },
          zoom: 12,
        },
        saguenay: {
          label: "Saguenay",
          center: { lat: 48.4281, lng: -71.068 },
          zoom: 11,
        },
      },
    },
    saskatchewan: {
      label: "Saskatchewan",
      center: { lat: 52.9399, lng: -106.4509 },
      zoom: 6,
      cities: {
        saskatoon: {
          label: "Saskatoon",
          center: { lat: 52.1332, lng: -106.67 },
          zoom: 12,
        },
        regina: {
          label: "Regina",
          center: { lat: 50.4452, lng: -104.6189 },
          zoom: 12,
        },
        princeAlbert: {
          label: "Prince Albert",
          center: { lat: 53.2033, lng: -105.7531 },
          zoom: 12,
        },
        swiftCurrent: {
          label: "Swift Current",
          center: { lat: 50.2851, lng: -107.7972 },
          zoom: 12,
        },
      },
    },
    yukon: {
      label: "Yukon",
      center: { lat: 64.2823, lng: -135.0 },
      zoom: 5,
      cities: {
        whitehorse: {
          label: "Whitehorse",
          center: { lat: 60.7212, lng: -135.0568 },
          zoom: 11,
        },
        dawsonCity: {
          label: "Dawson City",
          center: { lat: 64.0601, lng: -139.4323 },
          zoom: 10,
        },
        watsonLake: {
          label: "Watson Lake",
          center: { lat: 60.063, lng: -128.7086 },
          zoom: 10,
        },
      },
    },
  };

  // POI type mapping for Google Places API (subcategories)
  const poiTypeMapping = {
    bank: [{ type: "bank" }],
    atm: [{ type: "atm" }],
    pharmacy: [{ type: "pharmacy" }],
    restaurant: [{ type: "restaurant" }],
    bar: [{ type: "bar" }],
    coffee: [{ type: "cafe" }],
    bakery: [{ type: "bakery" }],
    park: [{ type: "park" }],
    liquor_store: [{ type: "liquor_store" }],
    // grocery_or_supermarket: [{type: 'grocery_or_supermarket'}],
    supermarket: [{ type: "supermarket" }],
    grocery: [{ type: "store", keyword: "grocery" }],
    store: [{ type: "store" }],
    shopping_mall: [{ type: "shopping_mall" }],
    bus_station: [{ type: "bus_station" }],
    subway_station: [{ type: "subway_station" }],
    train_station: [{ type: "train_station" }],
    transit_station: [{ type: "transit_station" }],
    gym: [{ type: "gym" }],
    stadium: [{ type: "stadium" }],
    sports: [{ type: "tourist_attraction", keyword: "sports" }],
    recreation_center: [
      { type: "point_of_interest", keyword: "recreation center" },
    ],
  };

  const poiTypeColors = {
    bank: "#FFD700",
    atm: "#FFD700",

    pharmacy: "#E31837",

    restaurant: "#6F4E37",
    bar: "#8E24AA",
    coffee: "#4E3629",
    bakery: "#D2B48C",

    park: "#2D5A27",

    liquor_store: "#4A148C",

    // grocery_or_supermarket: '#FF8C00',
    supermarket: "#FF8C00",
    grocery: "#FF8C00",

    store: "#004A99",
    shopping_mall: "#003366",

    bus_station: "#FFD100",
    subway_station: "#00923F",
    train_station: "#006B3F",
    transit_station: "#808080",

    gym: "#E65100",
    stadium: "#E65100",
    sports: "#E65100",
    recreation_center: "#E65100",
  };

  const normalizeHexForRgb = (hexColor) => {
    if (typeof hexColor !== "string") {
      return null;
    }
    const trimmed = hexColor.trim();
    if (!trimmed.startsWith("#")) {
      return null;
    }
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    } else if (hex.length === 4) {
      hex = hex
        .slice(0, 3)
        .split("")
        .map((ch) => ch + ch)
        .join("");
    } else if (hex.length === 8) {
      hex = hex.slice(0, 6);
    }
    if (hex.length !== 6) {
      return null;
    }
    return hex;
  };

  const SUBJECT_SITE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon fill="#ff0000" points="50,1 61,39 99,39 69,61 80,99 50,77 20,99 31,61 1,39 39,39"/></svg>';

  const normalizeRequestConfig = (config) => {
    if (!config) return null;
    if (typeof config === "string") {
      const trimmed = config.trim();
      return trimmed ? { type: trimmed } : null;
    }
    if (typeof config === "object") {
      const normalized = {};
      if (typeof config.type === "string") {
        const trimmedType = config.type.trim();
        if (trimmedType) {
          normalized.type = trimmedType;
        }
      }
      if (typeof config.keyword === "string") {
        const trimmedKeyword = config.keyword.trim();
        if (trimmedKeyword) {
          normalized.keyword = trimmedKeyword;
        }
      }
      return Object.keys(normalized).length ? normalized : null;
    }
    return null;
  };

  const markerIconCache = {};
  let subjectSiteIcon = null;
  // let bankIcon = null;
  // let pharmacyIcon = null;
  // let foodDrinkIcon = null;
  // let parkIcon = null;
  // let liquorIcon = null;
  // let grocerIcon = null;
  // let retailersIcon = null;
  // let transitIcon = null;
  // let sportIcon = null;
  let subjectSiteSnapshotOverlay = null;
  let subjectSiteZoneOverlay = null;

  const legendIconResolvers = {
    subjectSite: () => getSubjectSiteIcon(),
    bank: () => getIcon("bank"),
    atm: () => getIcon("atm"),
    pharmacy: () => getIcon("pharmacy"),
    restaurant: () => getIcon("restaurant"),
    bar: () => getIcon("bar"),
    coffee: () => getIcon("coffee"),
    bakery: () => getIcon("bakery"),
    park: () => getIcon("park"),
    liquor_store: () => getIcon("liquor_store"),
    // grocery_or_supermarket: () => getIcon('grocery_or_supermarket'),
    supermarket: () => getIcon("supermarket"),
    grocery: () => getIcon("grocery"),
    store: () => getIcon("store"),
    shopping_mall: () => getIcon("shopping_mall"),
    bus_station: () => getIcon("bus_station"),
    subway_station: () => getIcon("subway_station"),
    train_station: () => getIcon("train_station"),
    transit_station: () => getIcon("transit_station"),
    gym: () => getIcon("gym"),
    stadium: () => getIcon("stadium"),
    sports: () => getIcon("sports"),
    recreation_center: () => getIcon("recreation_center"),
  };

  const getMarkerIcon = (color) => {
    if (markerIconCache[color]) {
      return markerIconCache[color];
    }

    const canvas = document.createElement("canvas");
    canvas.width = 14;
    canvas.height = 22;
    console.log("Canvas dimensions set to:", canvas.width, canvas.height);
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const topY = 3;
    const bodyRadius = 6;
    const controlOffset = bodyRadius * 0.85;
    const tipY = canvas.height - 2;

    ctx.fillStyle = color;
    ctx.strokeStyle = shadeColor(color, -20);
    ctx.lineWidth = 0.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.bezierCurveTo(
      centerX + bodyRadius,
      topY + 2,
      centerX + bodyRadius + 6,
      topY + bodyRadius,
      centerX,
      tipY,
    );
    ctx.bezierCurveTo(
      centerX - bodyRadius - 6,
      topY + bodyRadius,
      centerX - bodyRadius,
      topY + 2,
      centerX,
      topY,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner circle highlight
    const highlightRadius = 3;
    const highlightCenterY = topY + bodyRadius * 0.55;
    ctx.beginPath();
    ctx.arc(centerX, highlightCenterY, highlightRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    const icon = {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(canvas.width, canvas.height),
      anchor: new google.maps.Point(Math.round(centerX), Math.round(tipY)),
      labelOrigin: new google.maps.Point(
        Math.round(centerX),
        Math.max(0, Math.round(topY - 2)),
      ),
    };

    markerIconCache[color] = icon;
    return icon;
  };

  const getSubjectSiteIcon = () => {
    if (subjectSiteIcon) {
      return subjectSiteIcon;
    }

    const url =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(SUBJECT_SITE_SVG);
    subjectSiteIcon = {
      url,
      scaledSize: new google.maps.Size(20, 20),
      anchor: new google.maps.Point(10, 10),
    };
    return subjectSiteIcon;
  };

  const ensureSubjectSiteOverlay = () => {
    if (!map) {
      return null;
    }
    if (subjectSiteSnapshotOverlay) {
      return subjectSiteSnapshotOverlay;
    }

    class SubjectSiteSnapshotOverlay extends google.maps.OverlayView {
      constructor() {
        super();
        this.position = null;
        this.visible = false;
        this.container = null;
      }

      onAdd() {
        this.container = document.createElement("div");
        this.container.className = "subject-site-snapshot-overlay";
        this.container.style.position = "absolute";
        this.container.style.width = "24px";
        this.container.style.height = "24px";
        this.container.style.transform = "translate(-50%, -50%)";
        this.container.style.pointerEvents = "none";
        this.container.style.display = "none";
        this.container.style.zIndex = "400000";
        this.container.innerHTML = SUBJECT_SITE_SVG;
        const panes = this.getPanes();
        if (panes && panes.overlayImage) {
          panes.overlayImage.appendChild(this.container);
        }
        this.draw();
      }

      draw() {
        if (!this.container) {
          return;
        }
        if (!this.visible || !this.position) {
          this.container.style.display = "none";
          return;
        }
        const projection = this.getProjection();
        if (!projection) {
          this.container.style.display = "none";
          return;
        }
        const pixel = projection.fromLatLngToDivPixel(this.position);
        if (!pixel) {
          this.container.style.display = "none";
          return;
        }
        this.container.style.left = `${pixel.x}px`;
        this.container.style.top = `${pixel.y}px`;
        this.container.style.display = "block";
      }

      onRemove() {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
      }

      updatePosition(position) {
        this.position = position;
        this.draw();
      }

      show() {
        this.visible = true;
        this.draw();
      }

      hide() {
        this.visible = false;
        this.draw();
      }

      clear() {
        this.position = null;
        this.hide();
      }
    }

    subjectSiteSnapshotOverlay = new SubjectSiteSnapshotOverlay();
    subjectSiteSnapshotOverlay.setMap(map);
    return subjectSiteSnapshotOverlay;
  };

  const clearSubjectSiteZone = () => {
    if (
      subjectSiteZoneOverlay &&
      typeof subjectSiteZoneOverlay.setMap === "function"
    ) {
      subjectSiteZoneOverlay.setMap(null);
    }
    subjectSiteZoneOverlay = null;
  };

  const extractLatLngLiteral = (input) => {
    if (!input) {
      return null;
    }
    if (Array.isArray(input)) {
      if (input.length < 2) {
        return null;
      }
      const first = Number(input[0]);
      const second = Number(input[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return null;
      }
      let lat = second;
      let lng = first;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        lat = first;
        lng = second;
      }
      return { lat, lng };
    }
    if (typeof input === "object") {
      if (typeof input.lat === "function" && typeof input.lng === "function") {
        const lat = Number(input.lat());
        const lng = Number(input.lng());
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }
      const latValue = input.lat ?? input.latitude ?? input.latitud;
      const lngValue =
        input.lng ?? input.lon ?? input.longitude ?? input.longitud;
      const lat = Number(latValue);
      const lng = Number(lngValue);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const parseZonePolygonPath = (coordinates) => {
    if (!Array.isArray(coordinates)) {
      return [];
    }
    if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
      return parseZonePolygonPath(coordinates[0]);
    }
    return coordinates.reduce((path, coord) => {
      const literal = extractLatLngLiteral(coord);
      if (literal) {
        path.push(literal);
      }
      return path;
    }, []);
  };

  const parseZoneBounds = (zoneConfig) => {
    if (!zoneConfig || typeof zoneConfig !== "object") {
      return null;
    }
    const boundsSource = zoneConfig.bounds || zoneConfig.viewport || zoneConfig;
    if (!boundsSource || typeof boundsSource !== "object") {
      return null;
    }
    let north = Number(
      boundsSource.north ?? boundsSource.top ?? boundsSource.maxLat,
    );
    let south = Number(
      boundsSource.south ?? boundsSource.bottom ?? boundsSource.minLat,
    );
    let east = Number(
      boundsSource.east ??
        boundsSource.right ??
        boundsSource.maxLng ??
        boundsSource.maxLon ??
        boundsSource.maxLong,
    );
    let west = Number(
      boundsSource.west ??
        boundsSource.left ??
        boundsSource.minLng ??
        boundsSource.minLon ??
        boundsSource.minLong,
    );
    let canUseNumbers = [north, south, east, west].every((value) =>
      Number.isFinite(value),
    );
    if (!canUseNumbers) {
      const northEast = extractLatLngLiteral(
        boundsSource.northeast || boundsSource.ne || boundsSource.topRight,
      );
      const southWest = extractLatLngLiteral(
        boundsSource.southwest || boundsSource.sw || boundsSource.bottomLeft,
      );
      if (northEast && southWest) {
        north = northEast.lat;
        east = northEast.lng;
        south = southWest.lat;
        west = southWest.lng;
        canUseNumbers = true;
      }
    }
    if (
      !canUseNumbers ||
      ![north, south, east, west].every((value) => Number.isFinite(value))
    ) {
      return null;
    }
    if (north < south) {
      const tmp = north;
      north = south;
      south = tmp;
    }
    if (east < west) {
      const tmp = east;
      east = west;
      west = tmp;
    }
    return { north, south, east, west };
  };

  const drawSubjectSiteZone = (zoneConfig) => {
    if (!map || !zoneConfig || typeof zoneConfig !== "object") {
      clearSubjectSiteZone();
      return null;
    }

    clearSubjectSiteZone();

    const coordinateSource =
      zoneConfig.coordinates ||
      zoneConfig.path ||
      zoneConfig.paths ||
      (Array.isArray(zoneConfig) ? zoneConfig : null);
    if (coordinateSource) {
      const path = parseZonePolygonPath(coordinateSource);
      if (path.length >= 3) {
        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor: "#d93025",
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: "#d93025",
          fillOpacity: 0.12,
          map,
        });
        subjectSiteZoneOverlay = polygon;
        const bounds = new google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        return { center: bounds.getCenter(), bounds };
      }
    }

    const boundsLiteral = parseZoneBounds(zoneConfig);
    if (boundsLiteral) {
      const rectangle = new google.maps.Rectangle({
        bounds: boundsLiteral,
        strokeColor: "#d93025",
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: "#d93025",
        fillOpacity: 0.12,
        map,
      });
      subjectSiteZoneOverlay = rectangle;
      const bounds =
        typeof rectangle.getBounds === "function"
          ? rectangle.getBounds()
          : null;
      if (bounds) {
        return { center: bounds.getCenter(), bounds };
      }
      const centerLat = (boundsLiteral.north + boundsLiteral.south) / 2;
      const centerLng = (boundsLiteral.east + boundsLiteral.west) / 2;
      return {
        center: new google.maps.LatLng(centerLat, centerLng),
        bounds: null,
      };
    }

    const centerLiteral = extractLatLngLiteral(zoneConfig.center);
    const radius = Number(zoneConfig.radius);
    if (centerLiteral && Number.isFinite(radius) && radius > 0) {
      const circle = new google.maps.Circle({
        center: centerLiteral,
        radius,
        strokeColor: "#d93025",
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: "#d93025",
        fillOpacity: 0.08,
        map,
      });
      subjectSiteZoneOverlay = circle;
      const bounds =
        typeof circle.getBounds === "function" ? circle.getBounds() : null;
      const center =
        typeof circle.getCenter === "function"
          ? circle.getCenter()
          : new google.maps.LatLng(centerLiteral.lat, centerLiteral.lng);
      return { center, bounds };
    }

    clearSubjectSiteZone();
    return null;
  };

  const generateAddressVariants = (address) => {
    const variants = new Set();
    const trimmed = typeof address === "string" ? address.trim() : "";
    if (!trimmed) {
      return [];
    }
    variants.add(trimmed);
    const normalized = trimmed.replace(/[&]/g, " and ");
    if (normalized !== trimmed) {
      variants.add(normalized);
    }
    const intersectionParts = normalized
      .split(/\s+and\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);
    if (intersectionParts.length >= 2) {
      intersectionParts.forEach((part) => variants.add(part));
      const reversed = [...intersectionParts].reverse().join(" and ");
      variants.add(reversed);
      variants.add(intersectionParts.join(" & "));
    }
    return Array.from(variants);
  };

  const buildLocationBiasBounds = (stateKey, cityKey) => {
    const stateConfig = stateKey ? locationOptions[stateKey] : null;
    const cityConfig =
      stateConfig && cityKey ? stateConfig.cities?.[cityKey] : null;
    const targetConfig = cityConfig || stateConfig;
    if (!targetConfig || !targetConfig.center) {
      return null;
    }
    const { lat, lng } = targetConfig.center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    const biasRadiusMeters = cityConfig ? 7000 : 20000;
    const latOffset = biasRadiusMeters / 111320;
    const latRadians = (lat * Math.PI) / 180;
    const cosLat = Math.cos(latRadians);
    if (!Number.isFinite(cosLat) || Math.abs(cosLat) < 1e-6) {
      return null;
    }
    const lngOffset = biasRadiusMeters / (111320 * cosLat);
    if (!Number.isFinite(latOffset) || !Number.isFinite(lngOffset)) {
      return null;
    }
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(lat + latOffset, lng + lngOffset));
    bounds.extend(new google.maps.LatLng(lat - latOffset, lng - lngOffset));
    return bounds;
  };

  const getRegionCenter = (stateKey, cityKey) => {
    const stateConfig = stateKey ? locationOptions[stateKey] : null;
    const cityConfig =
      stateConfig && cityKey ? stateConfig.cities?.[cityKey] : null;
    const targetConfig = cityConfig || stateConfig;
    const lat = targetConfig?.center?.lat;
    const lng = targetConfig?.center?.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, radius: cityConfig ? 5000 : 15000 };
    }
    return null;
  };

  const latLngBoundsToLiteral = (bounds) => {
    if (!bounds) {
      return null;
    }
    const getPoint =
      typeof bounds.getNorthEast === "function"
        ? bounds.getNorthEast.bind(bounds)
        : null;
    const getSouthWest =
      typeof bounds.getSouthWest === "function"
        ? bounds.getSouthWest.bind(bounds)
        : null;
    const northEast = getPoint
      ? getPoint()
      : bounds.northEast || bounds.northeast || bounds.Northeast;
    const southWest = getSouthWest
      ? getSouthWest()
      : bounds.southWest || bounds.southwest || bounds.Southwest;
    const neLiteral = extractLatLngLiteral(northEast);
    const swLiteral = extractLatLngLiteral(southWest);
    if (!neLiteral || !swLiteral) {
      return null;
    }
    return {
      north: Math.max(neLiteral.lat, swLiteral.lat),
      south: Math.min(neLiteral.lat, swLiteral.lat),
      east: Math.max(neLiteral.lng, swLiteral.lng),
      west: Math.min(neLiteral.lng, swLiteral.lng),
    };
  };

  const applyGeometryZone = (geometry) => {
    if (!geometry || typeof geometry !== "object") {
      clearSubjectSiteZone();
      return null;
    }
    const boundsLiteral = latLngBoundsToLiteral(
      geometry.bounds || geometry.viewport,
    );
    if (boundsLiteral) {
      return drawSubjectSiteZone({ bounds: boundsLiteral });
    }
    const centerLiteral = extractLatLngLiteral(geometry.location);
    if (centerLiteral) {
      return drawSubjectSiteZone({
        center: centerLiteral,
        radius: Number(geometry.accuracy) || 150,
      });
    }
    clearSubjectSiteZone();
    return null;
  };

  const ICON_PATHS = {
    // --- FINANZAS ---
    bank: "M11.5 1L2 6v2h19V6l-9.5-5zM5 9v10h2V9H5zm7 0v10h2V9h-2zm7 0v10h2V9h-2zM2 22h19v-2H2v2z",
    atm: "M8 17h2v-1h1v1h2v-1h1v1h2v-7H8v7zm1-5h6v1H9v-1zm10-8H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 6h14v2H5V6zm14 12H5V10h14v8z",

    // --- ALIMENTOS Y BEBIDAS ---
    restaurant:
      "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.86 3.75 3.97V22h2.5v-9.03C11.34 12.86 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
    bar: "M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z",
    coffee:
      "M4 19h16v2H4v-2zM20 9h-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4v-3h2c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2zm-4 6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6h12v9zm4-3h-2v-1h2v1zM9 1h1v3H9V1zm4 0h1v3h-1V1z",
    bakery:
      "M15.5 5.2c-.8-.5-1.9-.3-2.6.4l-2.1 2.1-2.1-2.1c-.7-.7-1.8-.9-2.6-.4-1.2.7-1.4 2.3-.4 3.3L12 15l6.3-6.4c1-1 .8-2.6-.8-3.4zM12 12.2l-3.5-3.5c-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0l2.8 2.8 2.8-2.8c.2-.2.5-.2.7 0 .2.2.2.5 0 .7L12 12.2z",
    liquor_store:
      "M7.5 7L7.5 2L16.5 2L16.5 7L19 7L19 22L5 22L5 7L7.5 7ZM9.5 4L9.5 7L14.5 7L14.5 4L9.5 4ZM7 9L7 20L17 20L17 9L7 9Z",

    // --- ABASTECIMIENTO (Supermarket y Grocery añadidos) ---
    // grocery_or_supermarket: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
    supermarket:
      "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
    grocery:
      "M19 13c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v5h14v-5zM12 1h-2v2h2V1zm5 4v2H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2zm2 4H5V7h14v2z",

    // --- RETAIL ---
    store:
      "M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2c0 .55.45 1 1 1v5h12v-5h4c.55 0 1-.45 1-1zM6 18v-4h6v4H6z",
    shopping_mall: "M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z",
    pharmacy:
      "M21 5h-2.64l1.14-3.14L17.15 1l-1.46 4H3v2l2 6-2 6v2h18v-2l-2-6 2-6V5zm-5 9h-3v3h-2v-3H8v-2h3V9h2v3h3v2z",

    // --- TRANSPORTE (Transit Station Actualizado) ---
    bus_station:
      "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
    subway_station:
      "M12 2c-4.42 0-8 .5-8 4v10c0 4.42 3.58 8 8 8s8-3.58 8-8V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm4 0h-3V6h3v5zm1.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    train_station:
      "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.71 0 5.83.42 6 2H6c.17-1.58 2.29-2 6-2zm5 11.5c0 .83-.67 1.5-1.5 1.5h-7c-.83 0-1.5-.67-1.5-1.5V12h10v3.5zm0-4.5H7V7h10v4z",
    transit_station:
      "M12 2c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-5H6V8h12v5z",

    // --- DEPORTES Y RECREACIÓN (Stadium y Rec Center añadidos) ---
    gym: "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14 4.14 5.57 2 7.71 3.43 9.14 2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86 19.86 18.43 22 16.29 20.57 14.86z",
    sports:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v5h5v-2h-3z",
    park: "M17 12h2L12 2 5.05 12H7l-3.9 6h6.92v3h3.95v-3H21l-4-6zM6.05 16l3.36-5.17L7.05 10.83 12 4l4.95 6.83-2.36 0L17.95 16H6.05z",
    stadium: "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
    recreation_center:
      "M12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10 5h-4.4l-2.1-3.4c-.3-.5-.9-.8-1.5-.8h-4c-.6 0-1.2.3-1.5.8L6.4 11H2v2h5l2-3h1v7h-2v4h6v-4h-2v-7h1l2 3h5v-2z",
  };

  let iconCache = {};

  const getIcon = (type) => {
    if (iconCache[type]) return iconCache[type];

    const path = ICON_PATHS[type] || ICON_PATHS.transit_station; // Fallback
    const color = poiTypeColors[type] || "#757575";

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="11" fill="#eff0f1" />
            <path fill="${color}" d="${path}" />
        </svg>`;

    const url = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

    iconCache[type] = {
      url,
      scaledSize: new google.maps.Size(20, 20),
      anchor: new google.maps.Point(10, 10),
      labelOrigin: new google.maps.Point(10, 0),
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      scale: 8,
    };

    return iconCache[type];
  };

  const shadeColor = (hexColor, percent) => {
    const normalized = normalizeHexForRgb(hexColor);
    if (!normalized) {
      return hexColor;
    }
    const num = parseInt(normalized, 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.min(255, Math.max(0, (num >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const pinIconCache = {};

  const getPinIcon = (type, scale = 0.8) => {
    if (pinIconCache[type]?.[scale]) return pinIconCache[type][scale];

    const path = ICON_PATHS[type] || ICON_PATHS.transit_station;
    const color = poiTypeColors[type] || "#757575";
    const darkColor = shadeColor(color, -30);

    const baseWidth = 24;
    const baseHeight = 36;

    const width = baseWidth * scale;
    const height = baseHeight * scale;
    const pinPath = `
M12 0
C5.373 0 0 5.373 0 12
c0 3.6 1.8 6.8 4.6 9
L12 36
l6.2-12
C22.2 18.8 24 15.6 24 12
C24 5.373 18.627 0 12 0
z`;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 36"
     width="${width}"
     height="${height}">
     
  <!-- Pin -->
  <path d="${pinPath}"
        fill="${color}"
        stroke="${darkColor}"
        stroke-width="${0.6 * scale}"/>

  <!-- Inner circle -->
  <circle cx="12" cy="12" r="7"
          fill="white"
          opacity="0.92"/>

  <!-- Icon -->
  <g transform="translate(4.5,4.5) scale(0.625)">
    <path fill="${color}" d="${path}"/>
  </g>

</svg>`;

    const url = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

    const iconConfig = {
      url,
      scaledSize: new google.maps.Size(width, height),
      anchor: new google.maps.Point(width / 2, height),
      labelOrigin: new google.maps.Point(width / 2, -4 * scale),
    };

    // cache por tipo + escala
    if (!pinIconCache[type]) pinIconCache[type] = {};
    pinIconCache[type][scale] = iconConfig;

    return iconConfig;
  };

  // Generates a pin icon with the label text embedded in the SVG below the pin.
  // Because text lives inside the icon image (not in marker.label), it respects
  // the marker's zIndex just like any other icon — no separate DOM label layer.
  const getPinIconWithLabel = (type, labelText, scale = 0.8) => {
    const path = ICON_PATHS[type] || ICON_PATHS.transit_station;
    const color = poiTypeColors[type] || "#757575";
    const darkColor = shadeColor(color, -30);

    const pinW = 24;
    const pinH = 36;
    const textRowH = 14; // height reserved below pin tip for the label

    // Estimate canvas width to fit text (7px per char at font-size 10)
    const estTextW = Math.max(64, labelText.length * 7 + 12);
    const canvasW = Math.max(pinW, estTextW);
    const canvasH = pinH + textRowH;
    const pinOffsetX = (canvasW - pinW) / 2; // center pin horizontally

    const pinPath = `M12 0 C5.373 0 0 5.373 0 12 c0 3.6 1.8 6.8 4.6 9 L12 36 l6.2-12 C22.2 18.8 24 15.6 24 12 C24 5.373 18.627 0 12 0 z`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasW} ${canvasH}" width="${canvasW * scale}" height="${canvasH * scale}">
  <g transform="translate(${pinOffsetX},0)">
    <path d="${pinPath}" fill="${color}" stroke="${darkColor}" stroke-width="0.6"/>
    <circle cx="12" cy="12" r="7" fill="white" opacity="0.92"/>
    <g transform="translate(4.5,4.5) scale(0.625)">
      <path fill="${color}" d="${path}"/>
    </g>
  </g>
  <text x="${canvasW / 2}" y="${pinH + 11}" font-family="Arial,sans-serif" font-size="10" font-weight="600" fill="#1a1a1a" text-anchor="middle" stroke="white" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke fill">${labelText}</text>
</svg>`;

    // Anchor = pin tip in rendered pixels.
    // Pin tip in viewBox coords: (pinOffsetX + 12, pinH).
    // Rendered scale = (canvasW * scale) / canvasW = scale (uniform).
    const anchorX = Math.round((pinOffsetX + 12) * scale);
    const anchorY = Math.round(pinH * scale);

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(canvasW * scale, canvasH * scale),
      anchor: new google.maps.Point(anchorX, anchorY),
    };
  };

  const getLegendIconUrl = (typeKey) => {
    const resolver = legendIconResolvers[typeKey];
    if (typeof resolver === "function") {
      const icon = resolver();
      return icon && icon.url ? icon.url : null;
    }
    const color = poiTypeColors[typeKey];
    if (color) {
      const icon = getMarkerIcon(color);
      return icon && icon.url ? icon.url : null;
    }
    return null;
  };

  const renderPoiTypeIcons = () => {
    if (!ui.poiTypeOptions) {
      return;
    }

    const optionElements = Array.from(
      ui.poiTypeOptions.querySelectorAll(".multi-select__option"),
    );
    optionElements.forEach((option) => {
      const typeKey = option.getAttribute("data-value");
      if (!typeKey || typeKey === "selectAll") {
        return;
      }
      const swatch = option.querySelector(".multi-select__swatch");
      if (!swatch || swatch.dataset.iconApplied === "true") {
        return;
      }
      const iconUrl = getLegendIconUrl(typeKey);
      if (!iconUrl) {
        return;
      }
      swatch.classList.add("multi-select__swatch--icon");
      swatch.textContent = "";
      const iconImg = document.createElement("img");
      iconImg.src = iconUrl;
      iconImg.alt = "";
      iconImg.setAttribute("aria-hidden", "true");
      iconImg.className = "multi-select__swatch-image";
      swatch.appendChild(iconImg);
      swatch.dataset.iconApplied = "true";
    });
  };

  const populateStateSelect = () => {
    if (!ui.stateSelect) {
      return;
    }

    ui.stateSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a region";
    placeholder.disabled = true;
    placeholder.hidden = true;
    ui.stateSelect.appendChild(placeholder);

    Object.entries(locationOptions).forEach(([key, config]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = config.label;
      ui.stateSelect.appendChild(option);
    });

    const preferredStateKey = locationOptions[DEFAULT_STATE_KEY]
      ? DEFAULT_STATE_KEY
      : Object.keys(locationOptions)[0];
    if (preferredStateKey) {
      ui.stateSelect.value = preferredStateKey;
    }
    ui.stateSelect.disabled = true;
    ui.stateSelect.setAttribute("aria-disabled", "true");
  };

  const populateCitySelect = (stateKey, selectedCityKey = "") => {
    if (!ui.citySelect) {
      return;
    }

    ui.citySelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a city";
    ui.citySelect.appendChild(placeholder);

    const stateConfig = locationOptions[stateKey];
    if (!stateConfig || !stateConfig.cities) {
      ui.citySelect.value = "";
      ui.citySelect.disabled = true;
      ui.citySelect.setAttribute("aria-disabled", "true");
      return;
    }

    Object.entries(stateConfig.cities).forEach(([cityKey, cityConfig]) => {
      const option = document.createElement("option");
      option.value = cityKey;
      option.textContent = cityConfig.label;
      ui.citySelect.appendChild(option);
    });

    if (selectedCityKey && stateConfig.cities[selectedCityKey]) {
      ui.citySelect.value = selectedCityKey;
    } else {
      ui.citySelect.value = "";
    }
    ui.citySelect.disabled = true;
    ui.citySelect.setAttribute("aria-disabled", "true");
  };

  const centerMapOnState = (stateKey) => {
    if (!map) {
      return;
    }
    const stateConfig = locationOptions[stateKey];
    if (!stateConfig || !stateConfig.center) {
      return;
    }
    map.panTo(stateConfig.center);
    map.setZoom(stateConfig.zoom || 6);
  };

  const centerMapOnCity = (stateKey, cityKey) => {
    if (!map) {
      return;
    }
    const stateConfig = locationOptions[stateKey];
    const cityConfig =
      stateConfig && stateConfig.cities ? stateConfig.cities[cityKey] : null;
    if (!cityConfig || !cityConfig.center) {
      return;
    }
    map.panTo(cityConfig.center);
    map.setZoom(cityConfig.zoom || stateConfig.zoom || 12);
  };

  const normalizeLocationString = (value) => {
    if (typeof value !== "string") {
      return "";
    }
    return value.trim().toLowerCase();
  };

  const toCamelCaseKey = (label) => {
    if (typeof label !== "string") {
      return "";
    }
    const sanitized = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, " ");
    if (!sanitized) {
      return "";
    }
    const parts = sanitized.split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return "";
    }
    return (
      parts[0] +
      parts
        .slice(1)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
    );
  };

  const generateCityKey = (stateConfig, cityLabel) => {
    if (!stateConfig) {
      return "";
    }
    const cities = stateConfig.cities || {};
    const base =
      toCamelCaseKey(cityLabel) || `city${Object.keys(cities).length + 1}`;
    let key = base;
    let index = 2;
    while (cities[key]) {
      key = `${base}${index}`;
      index += 1;
    }
    return key;
  };

  const geocodeCityCenter = async (cityLabel, provinceLabel) => {
    if (!geocoder || typeof cityLabel !== "string" || !cityLabel.trim()) {
      return null;
    }
    const trimmedCity = cityLabel.trim();
    const baseRestrictions = { country: "CA", locality: trimmedCity };
    if (typeof provinceLabel === "string" && provinceLabel.trim()) {
      baseRestrictions.administrativeArea = provinceLabel.trim();
    }
    const request = {
      address: baseRestrictions.administrativeArea
        ? `${trimmedCity}, ${baseRestrictions.administrativeArea}, Canada`
        : `${trimmedCity}, Canada`,
      componentRestrictions: baseRestrictions,
    };
    return new Promise((resolve) => {
      geocoder.geocode(request, (results, status) => {
        const okStatus = google.maps.GeocoderStatus
          ? google.maps.GeocoderStatus.OK
          : "OK";
        if (
          (status === okStatus || status === "OK") &&
          Array.isArray(results) &&
          results.length > 0
        ) {
          const locationLiteral = extractLatLngLiteral(
            results[0]?.geometry?.location,
          );
          if (locationLiteral) {
            resolve(locationLiteral);
            return;
          }
        }
        resolve(null);
      });
    });
  };

  const ensureCityOption = async (stateKey, cityLabel) => {
    const stateConfig = stateKey ? locationOptions[stateKey] : null;
    const normalizedLabel = normalizeLocationString(cityLabel);
    if (!stateConfig || !normalizedLabel) {
      return "";
    }
    if (!stateConfig.cities) {
      stateConfig.cities = {};
    }
    const existingEntry = Object.entries(stateConfig.cities).find(
      ([, config]) => normalizeLocationString(config.label) === normalizedLabel,
    );
    if (existingEntry) {
      return existingEntry[0];
    }
    let center = await geocodeCityCenter(cityLabel, stateConfig.label).catch(
      () => null,
    );
    if (
      !center &&
      stateConfig.center &&
      Number.isFinite(stateConfig.center.lat) &&
      Number.isFinite(stateConfig.center.lng)
    ) {
      center = { lat: stateConfig.center.lat, lng: stateConfig.center.lng };
    }
    const cityKey = generateCityKey(stateConfig, cityLabel);
    const cityConfig = { label: cityLabel, zoom: stateConfig.zoom || 12 };
    if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
      cityConfig.center = center;
    }
    stateConfig.cities[cityKey] = cityConfig;
    return cityKey;
  };

  const setLoading = (isLoading, labelText = "Loading...") => {
    if (!ui.loadingOverlay) {
      return;
    }
    if (
      ui.loadingOverlayLabel &&
      typeof labelText === "string" &&
      labelText.trim()
    ) {
      ui.loadingOverlayLabel.textContent = labelText;
    }
    if (isLoading) {
      ui.loadingOverlay.classList.add("loading-overlay--visible");
      ui.loadingOverlay.setAttribute("aria-hidden", "false");
    } else {
      ui.loadingOverlay.classList.remove("loading-overlay--visible");
      ui.loadingOverlay.setAttribute("aria-hidden", "true");
    }
  };

  const findStateKeyByLabel = (label) => {
    const target = normalizeLocationString(label);
    if (!target) {
      return "";
    }
    return Object.entries(locationOptions).reduce(
      (foundKey, [stateKey, config]) => {
        if (foundKey) {
          return foundKey;
        }
        return normalizeLocationString(config.label) === target ? stateKey : "";
      },
      "",
    );
  };

  const findCityKeyByLabel = (stateKey, label) => {
    const stateConfig = locationOptions[stateKey];
    const target = normalizeLocationString(label);
    if (!stateConfig || !stateConfig.cities || !target) {
      return "";
    }
    return Object.entries(stateConfig.cities).reduce(
      (foundKey, [cityKey, cityConfig]) => {
        if (foundKey) {
          return foundKey;
        }
        return normalizeLocationString(cityConfig.label) === target
          ? cityKey
          : "";
      },
      "",
    );
  };

  const applyLocationSelection = (stateKey, cityKey) => {
    if (!ui.stateSelect) {
      return;
    }
    if (!stateKey) {
      return;
    }
    ui.stateSelect.value = stateKey;
    populateCitySelect(stateKey, cityKey);
    if (
      cityKey &&
      ui.citySelect &&
      locationOptions[stateKey]?.cities?.[cityKey]
    ) {
      ui.citySelect.value = cityKey;
      centerMapOnCity(stateKey, cityKey);
    } else {
      if (ui.citySelect) {
        ui.citySelect.value = "";
      }
      centerMapOnState(stateKey);
    }
  };

  const geocodeSubjectSite = async (
    address,
    city,
    province,
    stateKey = "",
    cityKey = "",
  ) => {
    if (!geocoder) {
      return Promise.reject("GEOCODER_UNAVAILABLE");
    }
    const trimmedParts = [address, city, province]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean);
    if (!trimmedParts.length) {
      return Promise.reject("EMPTY_ADDRESS");
    }
    const biasBounds = buildLocationBiasBounds(stateKey, cityKey);
    const centerConfig = getRegionCenter(stateKey, cityKey);
    const baseRestrictions = { country: "CA" };
    if (province) {
      baseRestrictions.administrativeArea = province;
    }
    if (city) {
      baseRestrictions.locality = city;
    }

    const attempts = [];
    const seenSignatures = new Set();
    const registerAttempt = (request) => {
      if (!request || !request.address) {
        return;
      }
      const hasGetters =
        request.bounds &&
        typeof request.bounds.getNorthEast === "function" &&
        typeof request.bounds.getSouthWest === "function";
      const signature = JSON.stringify({
        address: request.address,
        componentRestrictions: request.componentRestrictions || null,
        bounds: hasGetters
          ? {
              north: request.bounds.getNorthEast().lat(),
              south: request.bounds.getSouthWest().lat(),
              east: request.bounds.getNorthEast().lng(),
              west: request.bounds.getSouthWest().lng(),
            }
          : null,
      });
      if (seenSignatures.has(signature)) {
        return;
      }
      seenSignatures.add(signature);
      attempts.push(request);
    };

    const addressVariants = generateAddressVariants(address);
    const joined = trimmedParts.join(", ");
    registerAttempt({
      address: joined,
      componentRestrictions: baseRestrictions,
      bounds: biasBounds,
    });
    registerAttempt({
      address: joined,
      componentRestrictions: baseRestrictions,
    });
    addressVariants.forEach((variant) => {
      if (!variant) return;
      registerAttempt({
        address: variant,
        componentRestrictions: baseRestrictions,
        bounds: biasBounds,
      });
      registerAttempt({
        address: variant,
        componentRestrictions: baseRestrictions,
      });
      registerAttempt({ address: variant, bounds: biasBounds });
      registerAttempt({ address: variant });
      registerAttempt({
        address: `${variant}, ${city}, ${province}`,
        componentRestrictions: baseRestrictions,
        bounds: biasBounds,
      });
      registerAttempt({
        address: `${variant}, ${city}, ${province}`,
        componentRestrictions: baseRestrictions,
      });
      registerAttempt({
        address: `${variant}, ${province}`,
        componentRestrictions: baseRestrictions,
        bounds: biasBounds,
      });
      registerAttempt({
        address: `${variant}, ${province}`,
        componentRestrictions: baseRestrictions,
      });
      registerAttempt({
        address: `${variant}, Canada`,
        componentRestrictions: { country: "CA" },
        bounds: biasBounds,
      });
    });
    if (city && province) {
      registerAttempt({
        address: `${city}, ${province}`,
        componentRestrictions: baseRestrictions,
        bounds: biasBounds,
      });
    }
    registerAttempt({
      address: `${address}, Canada`,
      componentRestrictions: { country: "CA" },
      bounds: biasBounds,
    });

    const geocodeAttempt = (request) =>
      new Promise((resolve, reject) => {
        geocoder.geocode(request, (results, status) => {
          const okStatus = google.maps.GeocoderStatus
            ? google.maps.GeocoderStatus.OK
            : "OK";
          if (
            (status === okStatus || status === "OK") &&
            Array.isArray(results) &&
            results.length > 0
          ) {
            resolve(results[0]);
            return;
          }
          reject(status || "GEOCODER_ERROR");
        });
      });

    let lastStatus = "GEOCODER_ERROR";
    for (const request of attempts) {
      try {
        const result = await geocodeAttempt(request);
        if (result) {
          return result;
        }
      } catch (status) {
        lastStatus = status;
        if (
          status === google.maps.GeocoderStatus?.OVER_QUERY_LIMIT ||
          status === "OVER_QUERY_LIMIT"
        ) {
          break;
        }
      }
    }
    const fallback = await findPlaceForSubjectSite(
      addressVariants,
      city,
      province,
      biasBounds,
      centerConfig,
    ).catch(() => null);
    if (fallback) {
      return fallback;
    }
    throw lastStatus;
  };

  async function findPlaceForSubjectSite(
    variants,
    city,
    province,
    biasBounds,
    centerConfig,
  ) {
    if (!placesService) {
      throw "PLACES_UNAVAILABLE";
    }
    const queries = [];
    const safeVariants = Array.isArray(variants)
      ? variants.filter(Boolean)
      : [];
    const cityProvince = [city, province].filter(Boolean).join(", ");
    const locationBias =
      biasBounds ||
      (centerConfig
        ? new google.maps.LatLng(centerConfig.lat, centerConfig.lng)
        : null);
    const baseQueries = safeVariants.length ? safeVariants : [cityProvince];
    baseQueries.forEach((variant) => {
      if (!variant) return;
      queries.push(`${variant}${cityProvince ? `, ${cityProvince}` : ""}`);
      if (province) {
        queries.push(`${variant}, ${province}, Canada`);
      }
      if (city) {
        queries.push(`${variant} near ${city}`);
      }
    });
    if (!queries.length && cityProvince) {
      queries.push(cityProvince);
    }

    const seen = new Set();
    const uniqueQueries = queries.filter((query) => {
      const trimmed = query.trim();
      if (!trimmed || seen.has(trimmed.toLowerCase())) {
        return false;
      }
      seen.add(trimmed.toLowerCase());
      return true;
    });
    if (!uniqueQueries.length) {
      throw "NO_QUERIES";
    }

    const placesStatus = google.maps.places?.PlacesServiceStatus || {};
    const okStatus = placesStatus.OK || "OK";
    const overLimitStatus = placesStatus.OVER_QUERY_LIMIT || "OVER_QUERY_LIMIT";

    const executeQuery = (query) =>
      new Promise((resolve, reject) => {
        const request = {
          query,
          fields: ["geometry", "formatted_address"],
        };
        if (locationBias) {
          request.locationBias = locationBias;
        }
        placesService.findPlaceFromQuery(request, (results, status) => {
          if (
            status === okStatus &&
            Array.isArray(results) &&
            results.length > 0 &&
            results[0].geometry
          ) {
            const enriched = { ...results[0] };
            if (!enriched.formatted_address) {
              enriched.formatted_address = query;
            }
            resolve(enriched);
            return;
          }
          reject(status || "PLACE_ERROR");
        });
      });

    let lastStatus = "PLACE_ERROR";
    for (const query of uniqueQueries) {
      try {
        const result = await executeQuery(query);
        if (result) {
          return result;
        }
      } catch (status) {
        lastStatus = status;
        if (status === overLimitStatus) {
          break;
        }
      }
    }
    throw lastStatus;
  }

  const applyImportedSubjectSite = async (importData) => {
    const rawAddress =
      typeof importData["Subject site address"] === "string"
        ? importData["Subject site address"].trim()
        : "";
    const rawCity =
      typeof importData["Subject site city"] === "string"
        ? importData["Subject site city"].trim()
        : "";
    const rawProvince =
      typeof importData["Subject site province"] === "string"
        ? importData["Subject site province"].trim()
        : "";
    if (!rawAddress || !rawCity || !rawProvince) {
      alert("The JSON file is missing the required Subject Site fields.");
      return;
    }

    const formattedAddress = [rawAddress].filter(Boolean).join(", ");
    if (ui.importedAddress) {
      ui.importedAddress.value = formattedAddress;
      ui.importedAddress.title = formattedAddress;
    }

    const stateKey = findStateKeyByLabel(rawProvince);
    let cityKey = "";
    if (!stateKey) {
      alert(
        "The province in the file is not available in the map configuration.",
      );
    } else {
      cityKey = findCityKeyByLabel(stateKey, rawCity);
      if (!cityKey) {
        cityKey = await ensureCityOption(stateKey, rawCity);
      }
      applyLocationSelection(stateKey, cityKey);
    }
    if (ui.stateSelect) {
      ui.stateSelect.title = rawProvince;
    }
    if (ui.citySelect) {
      ui.citySelect.title = rawCity;
    }

    clearPOIMarkers();
    clearSubjectSiteZone();

    try {
      const geocodeResult = await geocodeSubjectSite(
        rawAddress,
        rawCity,
        rawProvince,
        stateKey,
        cityKey,
      );
      const location = geocodeResult?.geometry?.location;
      if (!location) {
        throw new Error("GEOCODE_EMPTY");
      }
      createReferencePin(location);
      map.panTo(location);
      map.setZoom(16);
    } catch (errorStatus) {
      const statusMessage =
        typeof errorStatus === "string"
          ? errorStatus
          : errorStatus?.message || "";
      const statusDetail =
        statusMessage && statusMessage !== "GEOCODER_ERROR"
          ? ` (${statusMessage})`
          : "";
      alert(
        `The imported address could not be located on the map${statusDetail}.`,
      );
    }

    updateSearchButtonState();
  };

  const handleJsonImport = (file) => {
    if (!file) {
      return;
    }
    setLoading(true, "Reading JSON file...");
    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true, "Importing Subject Site...");
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const parsed = JSON.parse(text);
        const missingFields = REQUIRED_IMPORT_FIELDS.filter(
          (field) => !(field in parsed),
        );
        if (missingFields.length > 0) {
          alert("The JSON file does not match the expected format.");
        } else {
          await applyImportedSubjectSite(parsed);
        }
      } catch (error) {
        alert("The selected JSON file could not be processed.");
      } finally {
        if (ui.jsonImportInput) {
          ui.jsonImportInput.value = "";
        }
        setLoading(false);
      }
    };
    reader.onerror = () => {
      alert("An error occurred while reading the JSON file.");
      if (ui.jsonImportInput) {
        ui.jsonImportInput.value = "";
      }
      setLoading(false);
    };
    reader.readAsText(file, "utf-8");
  };

  const initializeLocationSelection = () => {
    if (!ui.stateSelect) {
      return;
    }
    const stateKey = ui.stateSelect.value;
    if (!stateKey) {
      return;
    }
    const stateConfig = locationOptions[stateKey];
    let targetCityKey = "";
    if (
      stateKey === DEFAULT_STATE_KEY &&
      locationOptions[DEFAULT_STATE_KEY]?.cities[DEFAULT_CITY_KEY]
    ) {
      targetCityKey = DEFAULT_CITY_KEY;
    } else if (
      ui.citySelect &&
      ui.citySelect.value &&
      stateConfig?.cities[ui.citySelect.value]
    ) {
      targetCityKey = ui.citySelect.value;
    }
    if (targetCityKey) {
      centerMapOnCity(stateKey, targetCityKey);
    } else {
      centerMapOnState(stateKey);
    }
  };

  const createLegendElement = (selectedTypes) => {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      return null;
    }

    const legend = document.createElement("div");
    legend.className = "export-legend";
    legend.setAttribute("data-export-legend", "true");

    const buildLegendRow = (labelText, typeKey) => {
      const row = document.createElement("div");
      row.className = "export-legend__item";
      const label = document.createElement("span");
      label.className = "export-legend__label";
      label.textContent = `${labelText}:`;
      row.appendChild(label);
      if (typeKey === "subjectSite") {
        const iconContainer = document.createElement("span");
        iconContainer.className =
          "export-legend__icon export-legend__icon--inline";
        iconContainer.innerHTML = SUBJECT_SITE_SVG;
        row.appendChild(iconContainer);
        return row;
      }
      const iconUrl = getLegendIconUrl(typeKey);
      if (iconUrl) {
        const icon = document.createElement("img");
        icon.src = iconUrl;
        icon.alt = `${labelText} icon`;
        icon.className = "export-legend__icon";
        row.appendChild(icon);
      }
      return row;
    };

    legend.appendChild(buildLegendRow("Subject Site", "subjectSite"));

    selectedTypes.forEach((typeKey) => {
      const labelText = poiTypeLabels[typeKey] || typeKey;
      legend.appendChild(buildLegendRow(`${labelText}`, typeKey));
    });

    mapElement.appendChild(legend);
    return legend;
  };

  const getAllPoiCheckboxes = () =>
    ui.poiTypeOptions
      ? Array.from(ui.poiTypeOptions.querySelectorAll('input[type="checkbox"]'))
      : [];

  const getSelectAllCheckbox = () => {
    const checkboxes = getAllPoiCheckboxes();
    return checkboxes.find((cb) => cb.value === SELECT_ALL_VALUE) || null;
  };

  const getPoiCheckboxes = () =>
    getAllPoiCheckboxes().filter((cb) => cb.value !== SELECT_ALL_VALUE);

  const getSelectedPoiTypes = () =>
    getPoiCheckboxes()
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

  const updateSelectAllCheckboxState = () => {
    const selectAllCheckbox = getSelectAllCheckbox();
    if (!selectAllCheckbox) return;
    const poiCheckboxes = getPoiCheckboxes();
    const total = poiCheckboxes.length;
    const selected = poiCheckboxes.filter((cb) => cb.checked).length;
    if (selected === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      return;
    }
    if (selected === total) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
      return;
    }
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  };

  const setDropdownState = (expanded) => {
    if (!ui.poiTypeOptions || !ui.poiTypeToggle) return;
    ui.poiTypeOptions.hidden = !expanded;
    ui.poiTypeToggle.setAttribute("aria-expanded", String(expanded));
  };

  const updateSearchButtonState = () => {
    if (!ui.searchPOI) return;
    const hasSelection = getSelectedPoiTypes().length > 0;
    ui.searchPOI.disabled = !referencePin || !hasSelection;
  };

  const syncPoiTypeSelect = () => {
    if (!ui.poiType || !ui.poiTypeToggle) return;
    const selectedLabels = [];
    getPoiCheckboxes().forEach((checkbox) => {
      const option = ui.poiType.querySelector(
        `option[value="${checkbox.value}"]`,
      );
      if (option) {
        option.selected = checkbox.checked;
      }
      if (checkbox.checked) {
        const labelText = checkbox
          .closest(".multi-select__option")
          ?.querySelector(".multi-select__label");
        selectedLabels.push(labelText ? labelText.textContent : checkbox.value);
      }
    });
    let toggleLabel = POI_TYPE_PLACEHOLDER;
    if (selectedLabels.length === 1) {
      toggleLabel = selectedLabels[0];
    } else if (selectedLabels.length > 1) {
      toggleLabel = `${selectedLabels.length} selected`;
    }
    ui.poiTypeToggle.textContent = toggleLabel;
    updateSelectAllCheckboxState();
    updateSearchButtonState();
  };

  // Create subject site marker
  const createReferencePin = (position) => {
    if (referencePin) {
      referencePin.setMap(null);
    }

    const referenceIcon = getSubjectSiteIcon();
    referencePin = new google.maps.Marker({
      position: position,
      map: map,
      title: "Subject Site",
      icon: referenceIcon,
      zIndex: 1000,
      optimized: false,
    });

    const snapshotOverlay = ensureSubjectSiteOverlay();
    if (snapshotOverlay) {
      snapshotOverlay.updatePosition(position);
    }

    updateSearchButtonState();
  };

  // Remove subject site marker
  const removeReferencePin = () => {
    if (referencePin) {
      referencePin.setMap(null);
      referencePin = null;
    }

    if (subjectSiteSnapshotOverlay) {
      subjectSiteSnapshotOverlay.clear();
    }

    clearSubjectSiteZone();

    clearPOIMarkers();
    updateSearchButtonState();
  };

  // Clear all POI markers for nearby results
  const clearPOIMarkers = () => {
    poiMarkers.forEach((marker) => marker.setMap(null));
    poiMarkers = [];
  };

  // Create POI marker
  const createPOIMarker = (place, typeKey) => {
    const markerColor = poiTypeColors[typeKey] || "#4caf50";
    let markerIcon = getPinIcon(typeKey);
    // if (typeKey === 'bank') {
    //     markerIcon = getBankIcon();
    // } else if (typeKey === 'pharmacy') {
    //     markerIcon = getPharmacyIcon();
    // } else if (typeKey === 'foodDrink') {
    //     markerIcon = getFoodDrinkIcon();
    // } else if (typeKey === 'park') {
    //     markerIcon = getParkIcon();
    // } else if (typeKey === 'liquorStores') {
    //     markerIcon = getLiquorIcon();
    // } else if (typeKey === 'grocer') {
    //     markerIcon = getGrocerIcon();
    // } else if (typeKey === 'retailers') {
    //     markerIcon = getRetailersIcon();
    // } else if (typeKey === 'transit') {
    //     markerIcon = getTransitIcon();
    // } else if (typeKey === 'sportRecreation') {
    //     markerIcon = getSportIcon();
    // } else {
    //     markerIcon = getMarkerIcon(markerColor);
    // }
    // Labeled types (park, stadium, recreation_center) get a lower zIndex (5) so
    // that when their embedded-text area overlaps a nearby pin, the pin (zIndex 10)
    // always renders on top. All other POI pins use zIndex 10.
    const LABELED_TYPES = ["park", "stadium", "recreation_center"];
    const isLabeled = LABELED_TYPES.includes(typeKey);

    const markerConfig = {
      position: place.geometry.location,
      map: map,
      zIndex: isLabeled ? 5 : 10,
    };
    // For labeled categories: embed the place name inside the pin SVG so the text
    // is part of the icon image and respects zIndex like any other marker icon.
    if (isLabeled) {
      const raw = String(place.name || "").trim();
      const labelTextVisible =
        raw.length > 30
          ? raw.slice(0, 27) + "..."
          : raw || poiTypeLabels[typeKey] || typeKey;
      markerIcon = getPinIconWithLabel(typeKey, labelTextVisible);
    }
    if (markerIcon) {
      markerConfig.icon = markerIcon;
    }
    const marker = new google.maps.Marker(markerConfig);
    // Attach info window to marker
    const address =
      place.vicinity || place.formatted_address || "Address not available";
    const infoWindow = new google.maps.InfoWindow({
      content: `
				<div style="padding: 8px; max-width: 200px;">
					<h3 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${place.name}</h3>
					<p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
				</div>
			`,
    });

    marker.addListener("click", () => {
      poiMarkers.forEach((m) => {
        if (m.infoWindow) {
          m.infoWindow.close();
        }
      });
      infoWindow.open(map, marker);
    });

    marker.infoWindow = infoWindow;
    return marker;
  };

  // Search for nearby POI across multiple types
  const searchNearbyPOI = () => {
    if (!referencePin) return;

    const selectedTypes = getSelectedPoiTypes();
    if (selectedTypes.length === 0) return;

    const origin = referencePin.getPosition();
    const radius = parseInt(ui.searchRadius.value, 10) || 1000;
    const requests = [];
    const requestSignatures = new Set();

    selectedTypes.forEach((typeKey) => {
      const configs = poiTypeMapping[typeKey];
      if (!Array.isArray(configs)) return;

      configs.forEach((config) => {
        const normalized = normalizeRequestConfig(config);
        if (!normalized) return;
        const signature = `${typeKey}:${normalized.type || ""}:${normalized.keyword || ""}`;
        if (requestSignatures.has(signature)) return;
        requestSignatures.add(signature);
        requests.push({ typeKey, params: normalized });
      });
    });

    if (requests.length === 0) return;
    if (!placesService || typeof placesService.nearbySearch !== "function") {
      alert("Google Places is not available right now.");
      return;
    }

    setLoading(true, "Searching for points of interest...");

    const combinedResults = [];
    const seenPlaceIds = new Set();
    let pending = requests.length;
    let errorStatus = null;

    clearPOIMarkers();

    requests.forEach(({ typeKey, params }) => {
      const request = {
        location: origin,
        radius: radius,
      };
      if (params.type) {
        request.type = params.type;
      }
      if (params.keyword) {
        request.keyword = params.keyword;
      }

      placesService.nearbySearch(request, (results, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          Array.isArray(results)
        ) {
          results.forEach((place) => {
            const placeId = place.place_id || place.id;
            if (placeId && seenPlaceIds.has(placeId)) {
              return;
            }
            if (placeId) {
              seenPlaceIds.add(placeId);
            }
            const marker = createPOIMarker(place, typeKey);
            poiMarkers.push(marker);
            combinedResults.push(place);
          });
        } else if (
          status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          errorStatus = status;
        }

        pending -= 1;
        if (pending === 0) {
          if (combinedResults.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(referencePin.getPosition());
            combinedResults.forEach((place) => {
              bounds.extend(place.geometry.location);
            });
            map.fitBounds(bounds);
          } else if (errorStatus) {
            alert("Search error: " + errorStatus);
          } else {
            alert("No POI found for the selected types.");
          }
          setLoading(false);
        }
      });
    });
  };

  // Attach UI event handlers
  const wireEvents = () => {
    if (ui.jsonImportButton && ui.jsonImportInput) {
      ui.jsonImportButton.addEventListener("click", () => {
        ui.jsonImportInput.click();
      });
      ui.jsonImportInput.addEventListener("change", (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
          return;
        }
        handleJsonImport(files[0]);
      });
    }

    // Enable subject site placement mode
    ui.addReferencePin.addEventListener("click", () => {
      map.setOptions({ draggableCursor: "crosshair" });

      const clickListener = google.maps.event.addListener(
        map,
        "click",
        (event) => {
          createReferencePin(event.latLng);
          map.setOptions({ draggableCursor: null });
          google.maps.event.removeListener(clickListener);
        },
      );
    });

    // Remove subject site marker
    ui.removeReferencePin.addEventListener("click", removeReferencePin);

    // Search POI
    ui.searchPOI.addEventListener("click", searchNearbyPOI);

    // Clear POI markers
    ui.clearPOI.addEventListener("click", () => {
      clearPOIMarkers();
      const expanded =
        ui.poiTypeToggle &&
        ui.poiTypeToggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        setDropdownState(false);
      }
    });

    // Toggle dropdown visibility
    ui.poiTypeToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const expanded =
        ui.poiTypeToggle.getAttribute("aria-expanded") === "true";
      setDropdownState(!expanded);
    });

    ui.poiTypeToggle.addEventListener("keydown", (event) => {
      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setDropdownState(true);
        const firstCheckbox = getSelectAllCheckbox() || getPoiCheckboxes()[0];
        if (firstCheckbox) {
          firstCheckbox.focus();
        }
      }
    });

    ui.poiTypeOptions.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setDropdownState(false);
        ui.poiTypeToggle.focus();
      }
    });

    ui.poiTypeOptions.addEventListener("change", (event) => {
      const target = event.target;
      if (!target.matches('input[type="checkbox"]')) {
        return;
      }
      if (target.value === SELECT_ALL_VALUE) {
        const shouldCheckAll = target.checked;
        target.indeterminate = false;
        getPoiCheckboxes().forEach((cb) => {
          cb.checked = shouldCheckAll;
        });
      }
      syncPoiTypeSelect();
    });

    document.addEventListener("click", (event) => {
      if (ui.poiTypeWrapper && !ui.poiTypeWrapper.contains(event.target)) {
        setDropdownState(false);
      }
    });

    if (ui.stateSelect) {
      ui.stateSelect.addEventListener("change", (event) => {
        const stateKey = event.target.value;
        populateCitySelect(stateKey);
        if (stateKey) {
          centerMapOnState(stateKey);
        } else if (ui.citySelect) {
          ui.citySelect.disabled = true;
          ui.citySelect.value = "";
        }
      });
    }

    if (ui.citySelect) {
      ui.citySelect.addEventListener("change", (event) => {
        const cityKey = event.target.value;
        const stateKey = ui.stateSelect ? ui.stateSelect.value : "";
        if (cityKey && stateKey) {
          centerMapOnCity(stateKey, cityKey);
        } else if (stateKey) {
          centerMapOnState(stateKey);
        }
      });
    }

    // Export map as PNG
    if (ui.exportPNG) {
      ui.exportPNG.addEventListener("click", () => {
        const mapElement = document.getElementById("map");
        if (!mapElement) return;
        ui.exportPNG.disabled = true;
        ui.exportPNG.textContent = "Exporting...";
        const selectedTypes = getSelectedPoiTypes();
        console.log("Selected types for export:", selectedTypes);
        const legend = createLegendElement(selectedTypes);
        const snapshotOverlay = referencePin
          ? ensureSubjectSiteOverlay()
          : null;
        let overlayVisible = false;
        if (snapshotOverlay && referencePin) {
          snapshotOverlay.updatePosition(referencePin.getPosition());
          snapshotOverlay.show();
          overlayVisible = true;
        }
        html2canvas(mapElement, {
          useCORS: true,
          backgroundColor: null,
          logging: false,
        })
          .then((canvas) => {
            const link = document.createElement("a");
            link.download = "map-poi-export.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
            ui.exportPNG.disabled = false;
            ui.exportPNG.textContent = "Export Map as PNG";
          })
          .catch(() => {
            alert("Failed to export map.");
            ui.exportPNG.disabled = false;
            ui.exportPNG.textContent = "Export Map as PNG";
          })
          .finally(() => {
            if (overlayVisible && snapshotOverlay) {
              snapshotOverlay.hide();
            }
            if (legend && legend.parentNode) {
              legend.parentNode.removeChild(legend);
            }
          });
      });
    }
  };

  // Cache relevant DOM references for later use
  const initControls = () => {
    ui.addReferencePin = document.getElementById("addReferencePin");
    ui.removeReferencePin = document.getElementById("removeReferencePin");
    ui.searchRadius = document.getElementById("searchRadius");
    ui.poiType = document.getElementById("poiType");
    ui.poiTypeWrapper = document.getElementById("poiTypeMultiSelect");
    ui.poiTypeToggle = document.getElementById("poiTypeToggle");
    ui.poiTypeOptions = document.getElementById("poiTypeOptions");
    ui.searchPOI = document.getElementById("searchPOI");
    ui.clearPOI = document.getElementById("clearPOI");
    ui.exportPNG = document.getElementById("exportPNG");
    ui.stateSelect = document.getElementById("stateSelect");
    ui.citySelect = document.getElementById("citySelect");
    ui.jsonImportButton = document.getElementById("jsonImportButton");
    ui.jsonImportInput = document.getElementById("jsonImportInput");
    ui.importedAddress = document.getElementById("importedAddress");
    ui.loadingOverlay = document.getElementById("loadingOverlay");
    ui.loadingOverlayLabel = document.getElementById("loadingOverlayLabel");
    if (ui.loadingOverlay) {
      ui.loadingOverlay.classList.remove("loading-overlay--visible");
      ui.loadingOverlay.setAttribute("aria-hidden", "true");
    }

    setDropdownState(false);
    syncPoiTypeSelect();
    renderPoiTypeIcons();
    populateStateSelect();
    if (ui.stateSelect && ui.stateSelect.value) {
      const initialState = ui.stateSelect.value;
      const preferredCity =
        initialState === DEFAULT_STATE_KEY &&
        locationOptions[initialState]?.cities[DEFAULT_CITY_KEY]
          ? DEFAULT_CITY_KEY
          : "";
      populateCitySelect(initialState, preferredCity);
    } else if (ui.citySelect) {
      ui.citySelect.disabled = true;
      ui.citySelect.setAttribute("aria-disabled", "true");
    }
    if (ui.stateSelect) {
      ui.stateSelect.disabled = true;
      ui.stateSelect.setAttribute("aria-disabled", "true");
    }
    if (ui.importedAddress) {
      ui.importedAddress.value = "";
      ui.importedAddress.setAttribute("readonly", "readonly");
    }
  };

  // Instantiate the base map and places service
  const createMap = () => {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 43.4643, lng: -80.5204 }, // Waterloo, Ontario, Canada
      zoom: 12,
      // Before: google.maps.MapTypeId.HYBRID
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: mapStyles,
    });

    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();
  };

  // Entry point invoked by the Maps JS API callback
  window.initMap = () => {
    initControls();
    createMap();
    initializeLocationSelection();
    wireEvents();
    updateSearchButtonState();
  };
})();
