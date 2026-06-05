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

  /* --- Asset-backed icons --------------------------------------------------- */
  var ICON_PATH = {
    star: "assets/star-icon.svg",
    hike: "assets/trail-icon.svg",
    stay: "assets/stay-icon.svg",
    scenic: "assets/sightseeing.svg",
    food: "assets/food-icon.svg"
  };
  var ICON = {
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
  var overviewZoom = null;
  var mapMaskCtx = null;
  var Z_OTHER_MARKER = 500;
  var Z_ACTIVE_POI = 1400;
  var Z_ACTIVE_MARKER = 1800;
  var geoProjector = null;
  var focusTimer = null;
  var mapResizeFrame = null;
  var mapResizeTimers = [];
  var smoothWheelFrame = null;
  var smoothWheelIdleTimer = null;
  var smoothWheelTargetZoom = null;
  var smoothWheelActive = false;
  var smoothWheelAnchor = null;

  /* --- Helpers -------------------------------------------------------------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function assetImg(src, cls, alt) {
    return '<img class="' + cls + '" src="' + src + '" alt="' + (alt || "") + '" draggable="false">';
  }
  function starAsset(cls) { return assetImg(ICON_PATH.star, cls, ""); }
  function catAsset(cat, cls) {
    var label = CAT_LABEL[cat] || cat || "Point of interest";
    return assetImg(ICON_PATH[cat] || ICON_PATH.scenic, cls, label);
  }
  function detailImage(d) { return d.cardImage || d.image; }
  // image-pixel (top-left origin) -> CRS.Simple latlng
  function P(px, py) { return L.latLng(H - py, px); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function scaledMapBounds(opts) {
    opts = opts || {};
    var s = opts.scale || 1;
    var ox = opts.offsetX || 0;
    var oy = opts.offsetY || 0;
    var dx = (W * (s - 1)) / 2;
    var dy = (H * (s - 1)) / 2;
    return [[0 - dy - oy, 0 - dx + ox], [H + dy - oy, W + dx + ox]];
  }
  function pxOf(d) { var p = PX[d.slug] || [W / 2, H / 2]; return { x: p[0], y: p[1] }; }
  function solve3(m, b) {
    var a = [
      [m[0][0], m[0][1], m[0][2], b[0]],
      [m[1][0], m[1][1], m[1][2], b[1]],
      [m[2][0], m[2][1], m[2][2], b[2]]
    ];
    var col, row, pivot, tmp, div, factor, c;

    for (col = 0; col < 3; col++) {
      pivot = col;
      for (row = col + 1; row < 3; row++) {
        if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
      }
      tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;

      div = a[col][col];
      if (Math.abs(div) < 0.000001) return null;
      for (c = col; c < 4; c++) a[col][c] /= div;

      for (row = 0; row < 3; row++) {
        if (row === col) continue;
        factor = a[row][col];
        for (c = col; c < 4; c++) a[row][c] -= factor * a[col][c];
      }
    }

    return [a[0][3], a[1][3], a[2][3]];
  }
  function fitGeoAxis(axis) {
    var m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var b = [0, 0, 0];

    D.forEach(function (d) {
      var p = PX[d.slug];
      if (!p || !Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return;

      var row = [d.lng, d.lat, 1];
      var target = p[axis];
      for (var r = 0; r < 3; r++) {
        b[r] += row[r] * target;
        for (var c = 0; c < 3; c++) m[r][c] += row[r] * row[c];
      }
    });

    return solve3(m, b);
  }
  function buildGeoProjector() {
    var x = fitGeoAxis(0);
    var y = fitGeoAxis(1);
    return x && y ? { x: x, y: y } : null;
  }
  function projectGeoPixel(p) {
    if (!geoProjector || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null;
    return {
      x: geoProjector.x[0] * p.lng + geoProjector.x[1] * p.lat + geoProjector.x[2],
      y: geoProjector.y[0] * p.lng + geoProjector.y[1] * p.lat + geoProjector.y[2]
    };
  }
  function explicitPoiPixel(p) {
    if (Number.isFinite(p.mapX) && Number.isFinite(p.mapY)) return { x: p.mapX, y: p.mapY };
    return null;
  }
  function basePoiPixel(p) {
    return projectGeoPixel(p) || explicitPoiPixel(p);
  }
  function isLandPoint(point) {
    if (!mapMaskCtx) return true;

    try {
      var x = Math.round(clamp(point.x, 0, W - 1));
      var y = Math.round(clamp(point.y, 0, H - 1));
      var d = mapMaskCtx.getImageData(x, y, 1, 1).data;
      var isOcean = d[0] < 40 && d[1] >= 65 && d[1] <= 105 && d[2] >= 85 && d[2] <= 130;
      return !isOcean;
    } catch (e) {
      mapMaskCtx = null;
      return true;
    }
  }
  function loadMapMask() {
    var img = new Image();

    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      mapMaskCtx = canvas.getContext("2d", { willReadFrequently: true });
      mapMaskCtx.drawImage(img, 0, 0, W, H);
      refreshBranches();
    };

    img.onerror = function () {
      mapMaskCtx = null;
    };

    img.src = BM.maskUrl || "assets/map-base.png";
  }
  // deterministic fan of POI pixel offsets below the star, used as a fallback
  function fallbackPoiPixel(d, i, n) {
    var c = pxOf(d);
    var r = 34 + (n > 2 ? 6 : 0);
    var spread = 46;                          // degrees between branches
    var a = 90 + (i - (n - 1) / 2) * spread;  // 90deg = straight down (screen)
    var rad = a * Math.PI / 180;
    return { x: c.x + r * Math.cos(rad), y: c.y + r * Math.sin(rad) };
  }
  function calloutAngles(c, n) {
    if (c.x < 130) return n === 1 ? [0] : (n === 2 ? [-35, 35] : [-55, 0, 55]);
    if (c.x > W - 130) return n === 1 ? [180] : (n === 2 ? [145, 215] : [125, 180, 235]);
    if (c.y > H - 90) return n === 1 ? [0] : (n === 2 ? [-165, -15] : [-165, -15, 25]);
    if (c.y < 90) return n === 1 ? [90] : (n === 2 ? [55, 125] : [45, 90, 135]);
    return n === 1 ? [90] : (n === 2 ? [55, 125] : [45, 90, 135]);
  }
  function calloutPixel(d, i, n, radius, angleOffset) {
    var c = pxOf(d);
    var angles = calloutAngles(c, n);
    var angle = (angles[i % angles.length] || 90) + (angleOffset || 0);
    return radialPixel(d, radius, angle);
  }
  function radialPixel(d, radius, angle) {
    var c = pxOf(d);
    var rad = angle * Math.PI / 180;
    return {
      x: clamp(c.x + radius * Math.cos(rad), 24, W - 24),
      y: clamp(c.y + radius * Math.sin(rad), 24, H - 24)
    };
  }
  function nearOtherDistillery(d, point) {
    return D.some(function (other) {
      if (other.slug === d.slug) return false;
      return dist(pxOf(other), point) < 42;
    });
  }
  function overlapsPlaced(point, placed) {
    return placed.some(function (other) {
      return dist(other.point, point) < 42;
    });
  }
  function layoutPoiPixels(d) {
    var c = pxOf(d);
    var n = d.pois.length;
    var placed = [];

    return d.pois.map(function (p, i) {
      var base = basePoiPixel(p) || fallbackPoiPixel(d, i, n);
      var direct = { x: clamp(base.x, 24, W - 24), y: clamp(base.y, 24, H - 24) };
      var directDistance = dist(c, direct);
      var candidates = [];
      var radii = [58, 70, 82];
      var offsets = [0, -18, 18, -34, 34];
      var sweepAngles = [0, 45, 90, 135, 180, 225, 270, 315, 30, 60, 120, 150, 210, 240, 300, 330];

      if (Number.isFinite(p.calloutAngle)) {
        candidates.push(radialPixel(d, p.calloutRadius || 58, p.calloutAngle));
      }
      if (directDistance >= 46 && directDistance <= 115 && !nearOtherDistillery(d, direct)) {
        candidates.push(direct);
      }
      radii.forEach(function (radius) {
        offsets.forEach(function (offset) {
          candidates.push(calloutPixel(d, i, n, radius, offset));
        });
        sweepAngles.forEach(function (angle, ai) {
          candidates.push(radialPixel(d, radius, sweepAngles[(ai + i * 5) % sweepAngles.length]));
        });
      });

      for (var ci = 0; ci < candidates.length; ci++) {
        var candidate = candidates[ci];
        if (dist(c, candidate) < 44) continue;
        if (!isLandPoint(candidate)) continue;
        if (overlapsPlaced(candidate, placed)) continue;

        var item = {
          point: candidate,
          drawRoute: dist(c, candidate) <= 115
        };
        placed.push(item);
        return item;
      }

      return { hidden: true, point: direct, drawRoute: false };
    });
  }
  function focusDistillery(d) {
    var c = pxOf(d);
    var target = P(c.x, c.y);
    var currentZoom = map.getZoom();
    var focusZoom = (overviewZoom == null ? currentZoom : overviewZoom + 0.95);

    stopSmoothWheelZoom();
    map.invalidateSize({ pan: false, animate: false });
    map.stop();
    map.flyTo(target, Math.max(currentZoom, focusZoom), {
      animate: true,
      duration: 0.7,
      easeLinearity: 0.16,
      noMoveStart: true
    });
  }
  function scheduleFocus(d, delay) {
    if (focusTimer) window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(function () {
      focusTimer = null;
      focusDistillery(d);
    }, delay);
  }
  function requestMapResize() {
    if (mapResizeFrame) return;
    mapResizeFrame = window.requestAnimationFrame(function () {
      mapResizeFrame = null;
      if (!map) return;
      map.invalidateSize({ pan: false, animate: false });
      refreshBranches();
    });
  }
  function resizeMapSoon() {
    mapResizeTimers.forEach(function (timer) { window.clearTimeout(timer); });
    mapResizeTimers = [];

    [0, 140, 300].forEach(function (delay) {
      if (delay === 0) {
        requestMapResize();
        return;
      }
      mapResizeTimers.push(window.setTimeout(requestMapResize, delay));
    });
  }
  function normalizedWheelDelta(e) {
    if (e.deltaMode === 1) return e.deltaY * 16;
    if (e.deltaMode === 2) return e.deltaY * Math.max(window.innerHeight, 1);
    return e.deltaY;
  }
  function finiteMaxZoom() {
    var max = map.getMaxZoom();
    return Number.isFinite(max) ? max : 3;
  }
  function stopSmoothWheelZoom() {
    if (smoothWheelFrame) {
      window.cancelAnimationFrame(smoothWheelFrame);
      smoothWheelFrame = null;
    }
    if (smoothWheelIdleTimer) {
      window.clearTimeout(smoothWheelIdleTimer);
      smoothWheelIdleTimer = null;
    }
    smoothWheelTargetZoom = null;
    smoothWheelActive = false;
    smoothWheelAnchor = null;
  }
  function stepSmoothWheelZoom() {
    smoothWheelFrame = null;
    if (!Number.isFinite(smoothWheelTargetZoom)) return;

    var current = map.getZoom();
    var diff = smoothWheelTargetZoom - current;
    var next = Math.abs(diff) < 0.006 ? smoothWheelTargetZoom : current + diff * 0.34;

    if (smoothWheelAnchor) {
      map.setZoomAround(smoothWheelAnchor, next, { animate: false });
    } else {
      map.setZoom(next, { animate: false });
    }

    if (Math.abs(smoothWheelTargetZoom - next) >= 0.006) {
      smoothWheelFrame = window.requestAnimationFrame(stepSmoothWheelZoom);
    }
  }
  function onSmoothWheelZoom(e) {
    e.preventDefault();
    e.stopPropagation();

    if (focusTimer) {
      window.clearTimeout(focusTimer);
      focusTimer = null;
    }
    map.stop();

    if (!Number.isFinite(smoothWheelTargetZoom)) smoothWheelTargetZoom = map.getZoom();
    smoothWheelActive = true;
    smoothWheelAnchor = map.mouseEventToContainerPoint(e);

    var change = clamp(-normalizedWheelDelta(e) * 0.0048, -0.7, 0.7);
    smoothWheelTargetZoom = clamp(smoothWheelTargetZoom + change, map.getMinZoom(), finiteMaxZoom());

    if (!smoothWheelFrame) smoothWheelFrame = window.requestAnimationFrame(stepSmoothWheelZoom);

    if (smoothWheelIdleTimer) window.clearTimeout(smoothWheelIdleTimer);
    smoothWheelIdleTimer = window.setTimeout(function () {
      smoothWheelIdleTimer = null;
      smoothWheelTargetZoom = null;
      smoothWheelActive = false;
      smoothWheelAnchor = null;
      refreshBranches();
    }, 180);
  }
  function bindSmoothWheelZoom() {
    map.getContainer().addEventListener("wheel", onSmoothWheelZoom, { passive: false });
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
  function poiBlurb(p) {
    var copy = {
      hike: "A nearby outdoor stop to stretch your legs and add some Nova Scotia scenery to the route.",
      stay: "A practical overnight option if you want to slow the trip down and stay close to the route.",
      scenic: "A local landmark or sightseeing stop that pairs well with this distillery visit.",
      food: "A nearby food or drink stop for building a fuller day around the tasting."
    };
    return copy[p.cat] || "A nearby stop worth adding to this part of the guide.";
  }

  /* --- Markers -------------------------------------------------------------- */
  function makeStarIcon(d) {
    var html =
      '<div class="cdans_marker" data-slug="' + d.slug + '">' +
        '<img class="cdans_bottle" src="' + d.image + '" alt="' + d.name + '" draggable="false">' +
        '<div class="cdans_star">' + starAsset("cdans_star_img") +
          '<span class="cdans_star_num">' + d.num + '</span>' +
        '</div>' +
      '</div>';
    return L.divIcon({ html: html, className: "cdans_divicon", iconSize: [76, 116], iconAnchor: [38, 100] });
  }
  function makePoiIcon(p) {
    var html = '<div class="cdans_poi cat-' + p.cat + '">' + catAsset(p.cat, "cdans_poi_img") + "</div>";
    return L.divIcon({ html: html, className: "cdans_divicon", iconSize: [36, 36], iconAnchor: [18, 18] });
  }

  /* --- POIs + routes for the active distillery ------------------------------ */
  function showBranches(d) {
    poiLayer.clearLayers();
    routeLayer.clearLayers();
    var c = pxOf(d);
    var layout = layoutPoiPixels(d);
    d.pois.forEach(function (p, i) {
      var entry = layout[i];
      if (!entry || entry.hidden) return;

      var pp = entry.point;
      var start = P(c.x, c.y);
      var end = P(pp.x, pp.y);

      if (entry.drawRoute) {
        L.polyline([start, end], {
          color: DATA.brand.star,
          weight: 3,
          opacity: 0.95,
          dashArray: "7 8",
          lineCap: "round",
          interactive: false,
          className: "cdans_branch_path"
        }).addTo(routeLayer);
      }

      var m = L.marker(end, {
        icon: makePoiIcon(p),
        riseOnHover: true,
        zIndexOffset: Z_ACTIVE_POI
      });
      m.bindPopup(
        '<div class="cdans_pop_name">' + p.name + "</div>" +
        '<div class="cdans_pop_cat">' + (CAT_LABEL[p.cat] || p.cat) + "</div>" +
        '<a class="cdans_poi_link" target="_blank" rel="noopener" href="' +
          gmapsDir(p.lat, p.lng, d.lat, d.lng) + '">Directions &rarr;</a>'
      );
      m.addTo(poiLayer);
    });
  }
  function refreshBranches() {
    if (!activeSlug) return;
    var d = D.find(function (x) { return x.slug === activeSlug; });
    if (d) showBranches(d);
  }

  /* --- Selection ------------------------------------------------------------ */
  function selectDistillery(slug, fly) {
    var d = D.find(function (x) { return x.slug === slug; });
    if (!d) return;
    activeSlug = slug;

    document.querySelectorAll("#cdans_app .cdans_item").forEach(function (n) {
      var isActive = n.getAttribute("data-slug") === slug;
      n.classList.toggle("is-active", isActive);
    });
    Object.keys(starMarkers).forEach(function (s) {
      starMarkers[s].setZIndexOffset(s === slug ? Z_ACTIVE_MARKER : Z_OTHER_MARKER);
      var node = starMarkers[s].getElement();
      if (node) {
        var mk = node.querySelector(".cdans_marker");
        if (mk) {
          mk.classList.toggle("is-active", s === slug);
        }
      }
    });

    showBranches(d);
    var detailWasOpen = renderDetail(d);

    if (fly !== false) {
      scheduleFocus(d, detailWasOpen ? 70 : 260);
    }
  }

  /* --- Detail panel --------------------------------------------------------- */
  function renderPoiCards(d) {
    if (!d.pois.length) return "";

    var cards = d.pois.map(function (p) {
      var visit = p.url
        ? '<a class="cdans_poi_action" target="_blank" rel="noopener" href="' + p.url + '">Visit</a>'
        : '<span class="cdans_poi_action is-disabled">No website</span>';

      return '<article class="cdans_poi_card">' +
        '<div class="cdans_poi_card_icon cat-' + p.cat + '">' + catAsset(p.cat, "cdans_poi_card_img") + "</div>" +
        '<div class="cdans_poi_card_body">' +
          '<div class="cdans_poi_card_meta">' + (CAT_LABEL[p.cat] || p.cat) + "</div>" +
          '<div class="cdans_poi_card_name">' + p.name + "</div>" +
          '<p class="cdans_poi_card_note">' + poiBlurb(p) + "</p>" +
          '<div class="cdans_poi_card_actions">' +
            visit +
            '<a class="cdans_poi_action" target="_blank" rel="noopener" href="' +
              gmapsDir(p.lat, p.lng, d.lat, d.lng) + '">Directions</a>' +
          "</div>" +
        "</div>" +
      "</article>";
    }).join("");

    return '<section class="cdans_nearby_section">' +
      '<div class="cdans_section_kicker">Nearby</div>' +
      '<div class="cdans_section_title">' + d.pois.length + " stops near this location</div>" +
      '<p class="cdans_section_intro">Use these as quick add-ons when you are planning the day around this stop.</p>' +
      '<a class="cdans_btn cdans_btn_ghost" target="_blank" rel="noopener" href="' + gmapsTrip(d) + '">' +
        ICON.route + " Plan distillery + nearby stops</a>" +
      '<div class="cdans_poi_cards">' + cards + "</div>" +
    "</section>";
  }
  function renderDetail(d) {
    var panel = document.getElementById("cdans_detail");
    var wasOpen = panel.classList.contains("is-open");

    panel.innerHTML =
      '<div class="cdans_detail_hero">' +
        '<img class="cdans_detail_bottle" src="' + detailImage(d) + '" alt="' + d.name + '">' +
        '<button class="cdans_detail_close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="cdans_detail_body">' +
        '<div class="cdans_detail_heading">' +
          '<div class="cdans_detail_badge">' + starAsset("cdans_detail_badge_star") +
            '<span class="cdans_detail_badge_num">' + d.num + "</span></div>" +
          '<div class="cdans_detail_heading_text">' +
            '<div class="cdans_detail_title">' + d.name + "</div>" +
            '<div class="cdans_detail_town">' + town(d.address) + "</div>" +
          "</div>" +
        "</div>" +
        '<p class="cdans_desc">' + d.desc + "</p>" +
        '<div class="cdans_addr">' + ICON.pin.replace("currentColor", DATA.brand.star) + "<span>" + d.address + "</span></div>" +
        '<a class="cdans_btn" target="_blank" rel="noopener" href="' + gmapsDir(d.lat, d.lng) + '">' +
          ICON.nav + " Get directions</a>" +
        renderPoiCards(d) +
      "</div>";

    panel.classList.add("is-open");
    document.getElementById("cdans_app").classList.add("is-detail-open");
    resizeMapSoon();
    panel.querySelector(".cdans_detail_close").addEventListener("click", closeDetail);
    return wasOpen;
  }
  function closeDetail() {
    if (focusTimer) {
      window.clearTimeout(focusTimer);
      focusTimer = null;
    }
    document.getElementById("cdans_detail").classList.remove("is-open");
    document.getElementById("cdans_app").classList.remove("is-detail-open");
    resizeMapSoon();
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
  function makeSidebarBadge(d) {
    return starAsset("cdans_item_badge_star") + '<span class="cdans_item_badge_num">' + d.num + "</span>";
  }
  function buildList() {
    var list = document.getElementById("cdans_list");
    D.slice().sort(function (a, b) { return a.num - b.num; }).forEach(function (d) {
      var item = el("div", "cdans_item");
      item.setAttribute("data-slug", d.slug);
      var main = el("button", "cdans_item_main");
      main.type = "button";
      main.appendChild(el("span", "cdans_item_badge", makeSidebarBadge(d)));
      var body = el("div", "cdans_item_body");
      body.appendChild(el("div", "cdans_item_name", d.name));
      body.appendChild(el("div", "cdans_item_town", town(d.address)));
      main.appendChild(body);
      main.appendChild(el("img", "cdans_item_bottle"));
      main.querySelector(".cdans_item_bottle").src = d.image;
      main.querySelector(".cdans_item_bottle").alt = d.name;
      item.appendChild(main);
      main.addEventListener("click", function () { selectDistillery(d.slug, true); });
      list.appendChild(item);
    });
  }
  function buildLegend() {
    var wrap = document.getElementById("cdans_legend");
    var items = [
      { label: "Distillery", icon: starAsset("cdans_legend_img") },
      { label: "Trail", icon: catAsset("hike", "cdans_legend_img") },
      { label: "Stay", icon: catAsset("stay", "cdans_legend_img") },
      { label: "Sightseeing", icon: catAsset("scenic", "cdans_legend_img") },
      { label: "Food & Drink", icon: catAsset("food", "cdans_legend_img") }
    ];
    items.forEach(function (it) {
      var n = el("div", "cdans_legend_item");
      var chip = el("span", "cdans_legend_chip", it.icon);
      n.appendChild(chip);
      n.appendChild(document.createTextNode(it.label));
      wrap.appendChild(n);
    });
  }

  /* --- Init ----------------------------------------------------------------- */
  function init() {
    buildLegend();
    buildList();
    geoProjector = buildGeoProjector();

    var bounds = [[0, 0], [H, W]];
    map = L.map("cdans_map", {
      crs: L.CRS.Simple,
      attributionControl: false,
      zoomControl: true,
      scrollWheelZoom: false,
      zoomAnimation: true,
      markerZoomAnimation: true,
      fadeAnimation: true,
      zoomSnap: 0,
      zoomDelta: 0.45,
      minZoom: -1.5,
      maxZoom: 3,
      inertia: true,
      inertiaDeceleration: 2600,
      inertiaMaxSpeed: 900,
      easeLinearity: 0.18,
      maxBoundsViscosity: 0.85
    });
    L.imageOverlay(BM.url, bounds).addTo(map);
    if (BM.decorations && BM.decorations.url) {
      L.imageOverlay(BM.decorations.url, scaledMapBounds(BM.decorations), {
        opacity: BM.decorations.opacity == null ? 1 : BM.decorations.opacity,
        className: "cdans_map_background_icons"
      }).addTo(map);
    }
    map.fitBounds(bounds);
    overviewZoom = map.getZoom();
    map.setMaxBounds(L.latLngBounds(bounds).pad(0.25));
    map.setMinZoom(map.getZoom() - 0.5);
    routeLayer.addTo(map);
    poiLayer.addTo(map);
    map.on("zoomend", function () {
      if (!smoothWheelActive) refreshBranches();
    });
    bindSmoothWheelZoom();
    loadMapMask();

    D.forEach(function (d) {
      var c = pxOf(d);
      var m = L.marker(P(c.x, c.y), { icon: makeStarIcon(d), riseOnHover: true, zIndexOffset: Z_OTHER_MARKER, draggable: false });
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
