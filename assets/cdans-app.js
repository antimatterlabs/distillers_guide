/* =============================================================================
 * CDANS Distillery Guide — App logic (Leaflet, flat brand basemap)
 * Depends on: Leaflet (global L) and window.CDANS_DATA (cdans-data.js)
 *
 * The map is the brand NS illustration (ocean #005166 / land #cdc5b6) rendered
 * as an image overlay in CRS.Simple. Distillery markers are placed in image-
 * pixel space (data.pixels) so they land exactly where the printed map's
 * numbered stars were. Real lat/lng are kept only to build Google Maps links.
 * ========================================================================== */
(function () {
  "use strict";

  var DATA = window.CDANS_DATA;
  var D = DATA.distilleries;
  var BM = DATA.basemap;            // { url, w, h }
  var PX = DATA.pixels;             // slug -> [px, py]
  var W = BM.w, H = BM.h;

  /* --- Inline SVG icons ----------------------------------------------------- */
  var ICON = {
    star: '<svg viewBox="0 0 24 24" class="cdans_star_svg"><path d="M12 1.6l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.4 5.8 20.6 7 13.8 2 8.9l6.9-1z"/></svg>',
    hike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1.6" fill="currentColor" stroke="none"/><path d="M11 8l2 3 3 1M11 8l-2 4 2 2 1 5M9 12l-2 6M14 9l2-2 3 1"/></svg>',
    stay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-5a2 2 0 012-2h10a3 3 0 013 3v4M3 13V7M21 18v-3M3 11h2.5a2.5 2.5 0 015 0"/></svg>',
    scenic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.2"/><path d="M8 6l1.5-2h5L16 6"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h11a0 0 0 010 0a5 5 0 01-5 5H10a5 5 0 01-5-5zM16 9h2.5a2.5 2.5 0 010 5H16M6 2v2M9 2v2M12 2v2M7 17h7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8 19h6a4 4 0 004-4V9M6 16.6V9a4 4 0 014-4h6"/></svg>'
  };
  var CAT_LABEL = { hike: "Trail / Nature", stay: "Stay", scenic: "Sightseeing", food: "Food & Drink" };

  /* --- State ---------------------------------------------------------------- */
  var map;
  var starMarkers = {};      // slug -> L.marker
  var poiLayer = L.layerGroup();
  var routeLayer = L.layerGroup();
  var activeSlug = null;
  var editMode = false;

  /* --- Helpers -------------------------------------------------------------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  // image-pixel (top-left origin) -> CRS.Simple latlng
  function P(px, py) { return L.latLng(H - py, px); }
  function pxOf(d) { var p = PX[d.slug] || [W / 2, H / 2]; return { x: p[0], y: p[1] }; }
  // deterministic fan of POI pixel offsets below the star
  function poiPixel(d, i, n) {
    var c = pxOf(d);
    var r = 34 + (n > 2 ? 6 : 0);
    var spread = 46;                          // degrees between branches
    var a = 90 + (i - (n - 1) / 2) * spread;  // 90deg = straight down (screen)
    var rad = a * Math.PI / 180;
    return { x: c.x + r * Math.cos(rad), y: c.y + r * Math.sin(rad) };
  }
  function town(addr) {
    var parts = addr.split(",").map(function (s) { return s.trim(); });
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length === 2) return parts[0];
    return addr;
  }
  function gmapsDir(destLat, destLng, originLat, originLng) {
    var u = "https://www.google.com/maps/dir/?api=1&destination=" + destLat + "," + destLng;
    if (originLat != null) u += "&origin=" + originLat + "," + originLng;
    return u;
  }
  function gmapsTrip(d) {
    var url = "https://www.google.com/maps/dir/?api=1&origin=" + d.lat + "," + d.lng;
    if (!d.pois.length) return url + "&destination=" + d.lat + "," + d.lng;
    var last = d.pois[d.pois.length - 1];
    url += "&destination=" + last.lat + "," + last.lng;
    if (d.pois.length > 1) {
      var wp = d.pois.slice(0, -1).map(function (p) { return p.lat + "," + p.lng; }).join("|");
      url += "&waypoints=" + encodeURIComponent(wp);
    }
    return url;
  }

  /* --- Markers -------------------------------------------------------------- */
  function makeStarIcon(d) {
    var html =
      '<div class="cdans_marker" data-slug="' + d.slug + '">' +
        '<img class="cdans_bottle" src="' + d.image + '" alt="' + d.name + '" draggable="false">' +
        '<div class="cdans_star">' + ICON.star +
          '<span class="cdans_star_num">' + d.num + '</span>' +
        '</div>' +
      '</div>';
    return L.divIcon({ html: html, className: "cdans_divicon", iconSize: [46, 70], iconAnchor: [23, 56] });
  }
  function makePoiIcon(p) {
    var html = '<div class="cdans_poi cat-' + p.cat + '">' + (ICON[p.cat] || ICON.pin) + "</div>";
    return L.divIcon({ html: html, className: "cdans_divicon", iconSize: [28, 34], iconAnchor: [14, 32] });
  }

  /* --- POIs + routes for the active distillery ------------------------------ */
  function showBranches(d) {
    poiLayer.clearLayers();
    routeLayer.clearLayers();
    var c = pxOf(d);
    var n = d.pois.length;
    d.pois.forEach(function (p, i) {
      var pp = poiPixel(d, i, n);
      L.polyline([P(c.x, c.y), P(pp.x, pp.y)], {
        color: DATA.brand.star, weight: 2.5, opacity: 0.9, dashArray: "5 6"
      }).addTo(routeLayer);

      var m = L.marker(P(pp.x, pp.y), { icon: makePoiIcon(p), riseOnHover: true });
      m.bindPopup(
        '<div class="cdans_pop_name">' + p.name + "</div>" +
        '<div class="cdans_pop_cat">' + (CAT_LABEL[p.cat] || p.cat) + "</div>" +
        '<a class="cdans_poi_link" target="_blank" rel="noopener" href="' +
          gmapsDir(p.lat, p.lng, d.lat, d.lng) + '">Directions &rarr;</a>'
      );
      m.addTo(poiLayer);
    });
  }

  /* --- Selection ------------------------------------------------------------ */
  function selectDistillery(slug, fly) {
    var d = D.find(function (x) { return x.slug === slug; });
    if (!d) return;
    activeSlug = slug;

    document.querySelectorAll("#cdans_app .cdans_item").forEach(function (n) {
      n.classList.toggle("is-active", n.getAttribute("data-slug") === slug);
    });
    Object.keys(starMarkers).forEach(function (s) {
      var node = starMarkers[s].getElement();
      if (node) { var mk = node.querySelector(".cdans_marker"); if (mk) mk.classList.toggle("is-active", s === slug); }
    });

    showBranches(d);
    renderDetail(d);

    if (fly !== false) {
      var c = pxOf(d);
      var pts = [P(c.x, c.y)];
      d.pois.forEach(function (p, i) { var pp = poiPixel(d, i, d.pois.length); pts.push(P(pp.x, pp.y)); });
      map.flyToBounds(L.latLngBounds(pts).pad(1.4), { maxZoom: map.getZoom() + 1.5, duration: 0.6 });
    }
  }

  /* --- Detail panel --------------------------------------------------------- */
  function renderDetail(d) {
    var panel = document.getElementById("cdans_detail");
    var pois = d.pois.map(function (p) {
      var link = p.url
        ? '<a class="cdans_poi_link" target="_blank" rel="noopener" href="' + p.url + '">Visit &rarr;</a>'
        : '<a class="cdans_poi_link is-disabled">No link</a>';
      return '<div class="cdans_poi_row">' +
        '<div class="cdans_poi_icon cat-' + p.cat + '">' + (ICON[p.cat] || ICON.pin) + "</div>" +
        '<div class="cdans_poi_info"><div class="cdans_poi_name">' + p.name + "</div>" +
        '<div class="cdans_poi_cat">' + (CAT_LABEL[p.cat] || p.cat) + "</div></div>" + link + "</div>";
    }).join("");

    panel.innerHTML =
      '<div class="cdans_detail_hero">' +
        '<img class="cdans_detail_bottle" src="' + d.image + '" alt="' + d.name + '">' +
        '<button class="cdans_detail_close" aria-label="Close">&times;</button>' +
        '<div class="cdans_detail_herotxt">' +
          '<div class="cdans_detail_badge">' + d.num + "</div>" +
          '<div><div class="cdans_detail_title">' + d.name + "</div>" +
          '<div class="cdans_detail_town">' + town(d.address) + "</div></div>" +
        "</div>" +
      "</div>" +
      '<div class="cdans_detail_body">' +
        '<p class="cdans_desc">' + d.desc + "</p>" +
        '<div class="cdans_addr">' + ICON.pin.replace("currentColor", DATA.brand.star) + "<span>" + d.address + "</span></div>" +
        '<a class="cdans_btn" target="_blank" rel="noopener" href="' + gmapsDir(d.lat, d.lng) + '">' +
          ICON.nav + " Get directions</a>" +
        (d.pois.length
          ? '<a class="cdans_btn cdans_btn_ghost" target="_blank" rel="noopener" href="' + gmapsTrip(d) + '">' +
              ICON.route + " Plan this trip in Google Maps</a>" +
            '<div class="cdans_poi_h">Nearby &middot; ' + d.pois.length + " stops</div>" +
            '<div class="cdans_poi_list">' + pois + "</div>"
          : "") +
      "</div>";

    panel.classList.add("is-open");
    panel.querySelector(".cdans_detail_close").addEventListener("click", closeDetail);
  }
  function closeDetail() {
    document.getElementById("cdans_detail").classList.remove("is-open");
  }

  /* --- Editor mode (drag to fine-tune pixel positions) ---------------------- */
  function commitDrag(d, marker) {
    var ll = marker.getLatLng();
    PX[d.slug] = [Math.round(ll.lng), Math.round(H - ll.lat)];
    document.getElementById("cdans_editbar").querySelector(".cdans_editbar_txt").textContent =
      d.name + ": [" + PX[d.slug][0] + ", " + PX[d.slug][1] + "]";
    if (activeSlug === d.slug) showBranches(d);
  }
  function toggleEdit() {
    editMode = !editMode;
    document.getElementById("cdans_editbtn").classList.toggle("is-on", editMode);
    document.getElementById("cdans_editbar").classList.toggle("is-on", editMode);
    Object.keys(starMarkers).forEach(function (s) {
      var m = starMarkers[s];
      if (editMode) { m.dragging.enable(); } else { m.dragging.disable(); }
    });
  }
  function copyCoords() {
    var txt = JSON.stringify(PX, null, 2);
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
    document.getElementById("cdans_editbar").querySelector(".cdans_editbar_txt").textContent =
      "Copied all pixel positions to clipboard.";
    console.log("CDANS pixel positions:\n", txt);
  }

  /* --- Sidebar list + legend ------------------------------------------------ */
  function buildList() {
    var list = document.getElementById("cdans_list");
    D.slice().sort(function (a, b) { return a.num - b.num; }).forEach(function (d) {
      var item = el("div", "cdans_item");
      item.setAttribute("data-slug", d.slug);
      item.appendChild(el("div", "cdans_item_badge", String(d.num)));
      var body = el("div", "cdans_item_body");
      body.appendChild(el("div", "cdans_item_name", d.name));
      body.appendChild(el("div", "cdans_item_town", town(d.address)));
      item.appendChild(body);
      item.appendChild(el("img", "cdans_item_bottle"));
      item.querySelector(".cdans_item_bottle").src = d.image;
      item.addEventListener("click", function () { selectDistillery(d.slug, true); });
      list.appendChild(item);
    });
  }
  function buildLegend() {
    var wrap = document.getElementById("cdans_legend");
    var items = [
      { label: "Distillery", color: DATA.brand.star, icon: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 1.6l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.4 5.8 20.6 7 13.8 2 8.9l6.9-1z"/></svg>' },
      { label: "Trail", color: "var(--cdans-hike)", icon: ICON.hike },
      { label: "Stay", color: "var(--cdans-stay)", icon: ICON.stay },
      { label: "Sightseeing", color: "var(--cdans-scenic)", icon: ICON.scenic },
      { label: "Food & Drink", color: "var(--cdans-food)", icon: ICON.food }
    ];
    items.forEach(function (it) {
      var n = el("div", "cdans_legend_item");
      var chip = el("span", "cdans_legend_chip", it.icon);
      chip.style.background = it.color;
      n.appendChild(chip);
      n.appendChild(document.createTextNode(it.label));
      wrap.appendChild(n);
    });
  }

  /* --- Init ----------------------------------------------------------------- */
  function init() {
    buildLegend();
    buildList();

    var bounds = [[0, 0], [H, W]];
    map = L.map("cdans_map", {
      crs: L.CRS.Simple,
      attributionControl: false,
      zoomControl: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      minZoom: -1.5,
      maxBoundsViscosity: 0.85
    });
    L.imageOverlay(BM.url, bounds).addTo(map);
    map.fitBounds(bounds);
    map.setMaxBounds(L.latLngBounds(bounds).pad(0.25));
    map.setMinZoom(map.getZoom() - 0.5);
    routeLayer.addTo(map);
    poiLayer.addTo(map);

    D.forEach(function (d) {
      var c = pxOf(d);
      var m = L.marker(P(c.x, c.y), { icon: makeStarIcon(d), riseOnHover: true, zIndexOffset: 600, draggable: false });
      m.on("click", function () { selectDistillery(d.slug, true); });
      m.on("dragend", function () { commitDrag(d, m); });
      m.addTo(map);
      starMarkers[d.slug] = m;
    });

    document.getElementById("cdans_editbtn").addEventListener("click", toggleEdit);
    document.getElementById("cdans_editcopy").addEventListener("click", copyCoords);

    // prime first distillery's branches but keep the detail panel closed
    selectDistillery(D[0].slug, false);
    closeDetail();
    map.fitBounds(bounds);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
