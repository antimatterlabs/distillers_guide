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
  var bounds = [[0, 0], [H, W]];

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
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8M8 11h6"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8 19h6a4 4 0 004-4V9M6 16.6V9a4 4 0 014-4h6"/></svg>'
  };
  var CAT_LABEL = { hike: "Trail / Nature", stay: "Stay", scenic: "Sightseeing", food: "Food & Drink" };

  /* --- State ---------------------------------------------------------------- */
  var map;
  var starMarkers = {};      // slug -> L.marker
  var poiLayer = L.layerGroup();
  var routeLayer = L.layerGroup();
  var tourLayer = L.layerGroup();
  var activeSlug = null;
  var editMode = false;
  var tourActive = false;
  var tourControlNodes = null;
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

  var activeTab = "distilleries";
  var activeLayers = {
    distillery: true,
    hike: false,
    stay: false,
    scenic: false,
    food: false
  };

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
  function haversineDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Earth radius in km
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function poiDistanceStr(p) {
    if (!p.parent || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || !Number.isFinite(p.parent.lat) || !Number.isFinite(p.parent.lng)) {
      return "";
    }
    var km = haversineDistance(p.parent.lat, p.parent.lng, p.lat, p.lng);
    if (km < 0.1) return "steps away";
    if (km < 1) return Math.round(km * 1000) + " m from distillery";
    return km.toFixed(1) + " km from distillery";
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
  function projectPoiPixel(p, d) {
    if (!geoProjector || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null;
    if (!d) return projectGeoPixel(p);

    var c = pxOf(d);
    var dLat = p.lat - d.lat;
    var dLng = p.lng - d.lng;

    var pdx = geoProjector.x[0] * dLng + geoProjector.x[1] * dLat;
    var pdy = geoProjector.y[0] * dLng + geoProjector.y[1] * dLat;

    return {
      x: c.x + pdx,
      y: c.y + pdy
    };
  }
  function explicitPoiPixel(p) {
    if (Number.isFinite(p.mapX) && Number.isFinite(p.mapY)) return { x: p.mapX, y: p.mapY };
    return null;
  }
  function basePoiPixel(p, d) {
    return explicitPoiPixel(p) || projectPoiPixel(p, d);
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
  function initializePoiLayouts() {
    D.forEach(function (d) {
      var layout = layoutPoiPixels(d);
      d.pois.forEach(function (p, i) {
        p.parent = d;
        p.layoutPoint = layout[i].point;
        p.layoutDrawRoute = layout[i].drawRoute;
        p.layoutHidden = layout[i].hidden;
      });
    });
  }
  function loadMapMask() {
    var img = new Image();

    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      mapMaskCtx = canvas.getContext("2d", { willReadFrequently: true });
      mapMaskCtx.drawImage(img, 0, 0, W, H);
      initializePoiLayouts();
      updateMapElements();
      buildExploreList();
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
      return dist(pxOf(other), point) < 36;
    });
  }
  function overlapsPlaced(point, placed) {
    return placed.some(function (other) {
      return dist(other.point, point) < 34;
    });
  }
  function layoutPoiPixels(d) {
    var c = pxOf(d);
    var n = d.pois.length;

    return d.pois.map(function (p, i) {
      var base = basePoiPixel(p, d) || fallbackPoiPixel(d, i, n);
      var direct = { x: clamp(base.x, 24, W - 24), y: clamp(base.y, 24, H - 24) };

      return {
        point: direct,
        drawRoute: dist(c, direct) <= 120
      };
    });
  }
  function focusDistillery(d) {
    var c = pxOf(d);
    var target = P(c.x, c.y);
    var currentZoom = map.getZoom();
    var focusZoom = (overviewZoom == null ? currentZoom : overviewZoom + 1.8);
    var targetZoom = Math.max(currentZoom, focusZoom);

    stopSmoothWheelZoom();
    map.invalidateSize({ pan: false, animate: false });
    map.stop();
    map.setView(target, targetZoom, {
      animate: true,
      duration: 0.65,
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

      var currentZoom = map.getZoom();
      var fitZoom = map.getBoundsZoom(bounds);
      overviewZoom = fitZoom;
      map.setMinZoom(fitZoom);

      if (currentZoom < fitZoom) {
        map.setZoom(fitZoom);
      }

      updateMapElements();
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
      updateMapElements();
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
  function gmapsDir(destName, destAddr, originName, originAddr) {
    var dest = encodeURIComponent(destName + (destAddr ? ", " + destAddr : ""));
    var u = "https://www.google.com/maps/dir/?api=1&destination=" + dest;
    if (originName) {
      var orig = encodeURIComponent(originName + (originAddr ? ", " + originAddr : ""));
      u += "&origin=" + orig;
    }
    return u;
  }
  function poiMapQuery(p, d) {
    return p.mapQuery || (p.name + ", " + town(d.address) + ", Nova Scotia");
  }
  function poiGmapsDir(p, d) {
    return gmapsDir(p.mapQuery || p.name, p.mapQuery ? "" : town(d.address) + ", Nova Scotia", d.name, d.address);
  }
  function gmapsTrip(d) {
    var origin = encodeURIComponent(d.name + ", " + d.address);
    var url = "https://www.google.com/maps/dir/?api=1&origin=" + origin;
    if (!d.pois.length) return url + "&destination=" + origin;

    var last = d.pois[d.pois.length - 1];
    var dest = encodeURIComponent(poiMapQuery(last, d));
    url += "&destination=" + dest;

    if (d.pois.length > 1) {
      var wp = d.pois.slice(0, -1).map(function (p) {
        return poiMapQuery(p, d);
      }).join("|");
      url += "&waypoints=" + encodeURIComponent(wp);
    }
    return url;
  }
  function orderedDistilleries() {
    var byNum = {};
    var used = {};
    var stops = [];

    D.forEach(function (d) {
      byNum[d.num] = d;
    });

    (Array.isArray(DATA.tourOrder) ? DATA.tourOrder : []).forEach(function (num) {
      var d = byNum[num];
      if (!d || used[d.num]) return;

      used[d.num] = true;
      stops.push(d);
    });

    D.slice().sort(function (a, b) { return a.num - b.num; }).forEach(function (d) {
      if (used[d.num]) return;

      used[d.num] = true;
      stops.push(d);
    });

    return stops;
  }
  function distilleryMapQuery(d) {
    return d.name + ", " + d.address;
  }
  function gmapsRouteUrl(stops) {
    if (!stops.length) return "https://www.google.com/maps";
    if (stops.length === 1) return gmapsDir(stops[0].name, stops[0].address);

    var origin = encodeURIComponent(distilleryMapQuery(stops[0]));
    var destination = encodeURIComponent(distilleryMapQuery(stops[stops.length - 1]));
    var url = "https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=" + origin + "&destination=" + destination;

    if (stops.length > 2) {
      var waypoints = stops.slice(1, -1).map(distilleryMapQuery).join("|");
      url += "&waypoints=" + encodeURIComponent(waypoints);
    }

    return url;
  }
  function gmapsFullTourLegs() {
    var stops = orderedDistilleries();
    return [{ label: "Open full tour in Google Maps", url: gmapsRouteUrl(stops) }];
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
  function profileParagraphs(d) {
    if (Array.isArray(d.profile) && d.profile.length) return d.profile;
    if (d.profile) return [d.profile];

    return [
      d.desc,
      "This expanded profile area can hold the maker story, signature bottles, tasting-room details, tour notes, seasonal hours, and booking information for " + d.name + "."
    ];
  }
  function profileModalMarkup(d) {
    var paragraphs = profileParagraphs(d).map(function (copy) {
      return "<p>" + copy + "</p>";
    }).join("");

    return '<div class="cdans_profile_scrim" data-profile-close></div>' +
      '<article class="cdans_profile_dialog" role="dialog" aria-modal="true" aria-labelledby="cdans_profile_title">' +
        '<div class="cdans_profile_hero">' +
          '<img class="cdans_profile_image" src="' + detailImage(d) + '" alt="' + d.name + '">' +
          '<button class="cdans_profile_close" type="button" aria-label="Close full profile" data-profile-close>&times;</button>' +
        "</div>" +
        '<div class="cdans_profile_body">' +
          '<div class="cdans_profile_heading">' +
            '<div class="cdans_detail_badge">' + starAsset("cdans_detail_badge_star") +
              '<span class="cdans_detail_badge_num">' + d.num + "</span></div>" +
            '<div class="cdans_detail_heading_text">' +
              '<div id="cdans_profile_title" class="cdans_profile_title">' + d.name + "</div>" +
              '<div class="cdans_detail_town">' + town(d.address) + "</div>" +
            "</div>" +
          "</div>" +
          '<div class="cdans_profile_copy">' + paragraphs + "</div>" +
          '<div class="cdans_profile_actions">' +
            '<a class="cdans_btn" target="_blank" rel="noopener" href="' + gmapsDir(d.name, d.address) + '">' +
              ICON.nav + " Get directions</a>" +
          "</div>" +
        "</div>" +
      "</article>";
  }
  function ensureProfileModal() {
    var modal = document.getElementById("cdans_profile_modal");
    if (modal) return modal;

    modal = el("div", "cdans_profile_modal");
    modal.id = "cdans_profile_modal";
    modal.hidden = true;

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-profile-close]")) closeProfileModal();
    });

    document.getElementById("cdans_app").appendChild(modal);
    return modal;
  }
  function openProfileModal(d) {
    var modal = ensureProfileModal();
    modal.innerHTML = profileModalMarkup(d);
    modal.hidden = false;
    window.requestAnimationFrame(function () {
      modal.classList.add("is-open");
      var close = modal.querySelector(".cdans_profile_close");
      if (close) close.focus();
    });
  }
  function closeProfileModal() {
    var modal = document.getElementById("cdans_profile_modal");
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.hidden = true;
  }
  function bindProfileModalKeys() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeProfileModal();
    });
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
  /* --- Full tour route ------------------------------------------------------ */
  function drawFullTourOverlay() {
    tourLayer.clearLayers();
    if (!tourActive) return;

    var stops = orderedDistilleries();
    var points = stops.map(function (d) {
      var c = pxOf(d);
      return P(c.x, c.y);
    });

    if (points.length > 1) {
      L.polyline(points, {
        color: "#ffffff",
        weight: 7,
        opacity: 0.68,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
        className: "cdans_full_tour_path_shadow"
      }).addTo(tourLayer);

      L.polyline(points, {
        color: DATA.brand.star,
        weight: 3.2,
        opacity: 0.9,
        dashArray: "9 8",
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
        className: "cdans_full_tour_path"
      }).addTo(tourLayer);
    }

  }
  function setFullTourActive(active) {
    tourActive = !!active;

    if (tourControlNodes) {
      tourControlNodes.wrap.classList.toggle("is-active", tourActive);
      tourControlNodes.button.classList.toggle("is-active", tourActive);
      tourControlNodes.button.setAttribute("aria-expanded", tourActive ? "true" : "false");
      tourControlNodes.button.setAttribute("aria-pressed", tourActive ? "true" : "false");
      tourControlNodes.panel.hidden = !tourActive;
      renderFullTourLinks(tourControlNodes.links);
    }

    if (tourActive) {
      activeLayers.distillery = true;
      buildLegend();
      buildList();
      drawFullTourOverlay();
      map.fitBounds(bounds, {
        animate: true,
        duration: 0.55,
        padding: [22, 22]
      });
    } else {
      tourLayer.clearLayers();
    }

    updateMapElements();
  }
  function renderFullTourLinks(container) {
    if (!container) return;

    container.innerHTML = "";
    gmapsFullTourLegs().forEach(function (leg) {
      var link = el("a", "cdans_tour_link", ICON.nav + "<span>" + leg.label + "</span>");
      link.href = leg.url;
      link.target = "_blank";
      link.rel = "noopener";
      container.appendChild(link);
    });
  }
  function buildFullTourControl() {
    var control = L.control({ position: "bottomright" });

    control.onAdd = function () {
      var wrap = el("div", "cdans_tour_control leaflet-control");
      var panel = el("div", "cdans_tour_panel");
      var close = el("button", "cdans_tour_close", "&times;");
      var button = el("button", "cdans_tour_btn", ICON.route + "<span>Full tour</span>");
      var links = el("div", "cdans_tour_links");

      close.type = "button";
      close.setAttribute("aria-label", "Hide full tour");

      panel.hidden = true;
      panel.appendChild(close);
      panel.appendChild(el("div", "cdans_tour_kicker", "Full route"));
      panel.appendChild(el("div", "cdans_tour_title", D.length + "-stop distillery tour"));
      panel.appendChild(el("div", "cdans_tour_meta", "Numbered guide order"));
      renderFullTourLinks(links);
      panel.appendChild(links);

      button.type = "button";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Show full distillery tour");

      wrap.appendChild(panel);
      wrap.appendChild(button);

      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.disableScrollPropagation(wrap);

      button.addEventListener("click", function (e) {
        L.DomEvent.stop(e);
        setFullTourActive(!tourActive);
      });
      close.addEventListener("click", function (e) {
        L.DomEvent.stop(e);
        setFullTourActive(false);
      });

      tourControlNodes = {
        wrap: wrap,
        panel: panel,
        button: button,
        links: links
      };

      return wrap;
    };

    return control;
  }

  /* --- POIs + routes for all distilleries ----------------------------------- */
  function updateMapElements() {
    // 1. Update distillery markers visibility and active states
    Object.keys(starMarkers).forEach(function (s) {
      var m = starMarkers[s];
      if (activeLayers.distillery) {
        if (!map.hasLayer(m)) {
          map.addLayer(m);
        }
        m.setZIndexOffset(s === activeSlug ? Z_ACTIVE_MARKER : Z_OTHER_MARKER);
        var node = m.getElement();
        if (node) {
          var mk = node.querySelector(".cdans_marker");
          if (mk) {
            mk.classList.toggle("is-active", s === activeSlug);
            mk.classList.toggle("is-tour-stop", tourActive);
          }
        }
      } else {
        if (map.hasLayer(m)) {
          map.removeLayer(m);
        }
      }
    });

    // 2. Clear current POIs and routes
    poiLayer.clearLayers();
    routeLayer.clearLayers();

    // 3. Draw visible POIs and their connection routes
    D.forEach(function (d) {
      var c = pxOf(d);
      var isParentActive = (d.slug === activeSlug);

      d.pois.forEach(function (p) {
        p.marker = null; // Clear old marker ref

        var isPoiVisible = isParentActive || activeLayers[p.cat];

        if (isPoiVisible) {
          var pp = p.layoutPoint;
          if (!pp || p.layoutHidden) return;

          var start = P(c.x, c.y);
          var end = P(pp.x, pp.y);

          // Draw dashed routes (only for the active distillery)
          if (p.layoutDrawRoute && activeLayers.distillery && isParentActive) {
            L.polyline([start, end], {
              color: DATA.brand.star,
              weight: 2.6,
              opacity: 0.58,
              dashArray: "7 8",
              lineCap: "round",
              interactive: false,
              className: "cdans_branch_path is-active-route"
            }).addTo(routeLayer);
          }

          // Create POI marker
          var m = L.marker(end, {
            icon: makePoiIcon(p),
            riseOnHover: true,
            zIndexOffset: isParentActive ? Z_ACTIVE_POI + 100 : Z_ACTIVE_POI,
            draggable: editMode
          });
          m.on("dragend", function () { commitPoiDrag(p, m); });

          var distStr = poiDistanceStr(p);
          m.bindPopup(
            '<div class="cdans_pop_name">' + p.name + "</div>" +
            '<div class="cdans_pop_cat">' + (CAT_LABEL[p.cat] || p.cat) + "</div>" +
            (distStr ? '<div class="cdans_pop_dist">' + distStr + '</div>' : '') +
            '<a class="cdans_poi_link" target="_blank" rel="noopener" href="' +
              poiGmapsDir(p, d) + '">Directions &rarr;</a>'
          );

          m.on("click", function () {
            if (activeSlug !== d.slug) {
              selectDistillery(d.slug, false);
              if (p.marker) {
                p.marker.openPopup();
              }
            }
          });

          m.addTo(poiLayer);
          p.marker = m; // Keep ref to trigger popup from sidebar
        }
      });
    });
  }

  /* --- Selection ------------------------------------------------------------ */
  function clearDistillerySelection(skipMapUpdate) {
    activeSlug = null;

    document.querySelectorAll("#cdans_app .cdans_item.is-active").forEach(function (n) {
      n.classList.remove("is-active");
    });

    document.querySelectorAll("#cdans_app .cdans_explore_item.is-active-parent").forEach(function (n) {
      n.classList.remove("is-active-parent");
    });

    closeDetail();

    if (!skipMapUpdate) {
      updateMapElements();
    }
  }

  function selectDistillery(slug, fly) {
    var d = D.find(function (x) { return x.slug === slug; });
    if (!d) return;
    if (activeSlug === slug) {
      clearDistillerySelection(false);
      return;
    }

    activeSlug = slug;

    // Update distillery list items active classes
    document.querySelectorAll("#cdans_app .cdans_item").forEach(function (n) {
      var isActive = n.getAttribute("data-slug") === slug;
      n.classList.toggle("is-active", isActive);
    });

    // Update explore list items active parent classes
    document.querySelectorAll("#cdans_app .cdans_explore_item").forEach(function (n) {
      var isActive = n.getAttribute("data-parent-slug") === slug;
      n.classList.toggle("is-active-parent", isActive);
    });

    updateMapElements();
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

      var distStr = poiDistanceStr(p);
      var metaStr = (CAT_LABEL[p.cat] || p.cat);
      if (distStr) metaStr += " • " + distStr;

      return '<article class="cdans_poi_card">' +
        '<div class="cdans_poi_card_icon cat-' + p.cat + '">' + catAsset(p.cat, "cdans_poi_card_img") + "</div>" +
        '<div class="cdans_poi_card_body">' +
          '<div class="cdans_poi_card_meta">' + metaStr + "</div>" +
          '<div class="cdans_poi_card_name">' + p.name + "</div>" +
          '<p class="cdans_poi_card_note">' + poiBlurb(p) + "</p>" +
          '<div class="cdans_poi_card_actions">' +
            visit +
            '<a class="cdans_poi_action" target="_blank" rel="noopener" href="' +
              poiGmapsDir(p, d) + '">Directions</a>' +
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
        '<button class="cdans_btn cdans_btn_profile" type="button">' +
          ICON.profile + " Read full profile</button>" +
        '<div class="cdans_addr">' + ICON.pin.replace("currentColor", DATA.brand.star) + "<span>" + d.address + "</span></div>" +
        '<a class="cdans_btn" target="_blank" rel="noopener" href="' + gmapsDir(d.name, d.address) + '">' +
          ICON.nav + " Get directions</a>" +
        renderPoiCards(d) +
      "</div>";

    panel.classList.add("is-open");
    document.getElementById("cdans_app").classList.add("is-detail-open");
    resizeMapSoon();
    panel.querySelector(".cdans_detail_close").addEventListener("click", function () {
      clearDistillerySelection(false);
    });
    panel.querySelector(".cdans_btn_profile").addEventListener("click", function () { openProfileModal(d); });
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
    if (tourActive) drawFullTourOverlay();
    if (activeSlug === d.slug) updateMapElements();
  }
  function commitPoiDrag(p, marker) {
    var ll = marker.getLatLng();
    p.mapX = Math.round(ll.lng);
    p.mapY = Math.round(H - ll.lat);
    p.calloutAngle = undefined;
    p.calloutRadius = undefined;

    document.getElementById("cdans_editbar").querySelector(".cdans_editbar_txt").textContent =
      p.name + ": mapX " + p.mapX + ", mapY " + p.mapY;

    initializePoiLayouts();
    updateMapElements();
  }
  function jsString(value) {
    return JSON.stringify(value == null ? "" : String(value));
  }
  function jsNumber(value) {
    if (!Number.isFinite(value)) return "null";
    return String(Math.round(value * 1000000) / 1000000);
  }
  function copyText(text, output) {
    var copied = false;

    if (output) {
      output.value = text;
      output.classList.add("is-on");
      output.focus();
      output.select();
      try {
        copied = document.execCommand("copy");
      } catch (e) {
        copied = false;
      }
    }

    if (!copied && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }
  function formatPoiForData(p) {
    var fields = [
      "name: " + jsString(p.name),
      "cat: " + jsString(p.cat),
      "lat: " + jsNumber(p.lat),
      "lng: " + jsNumber(p.lng)
    ];

    if (Number.isFinite(p.mapX)) fields.push("mapX: " + Math.round(p.mapX));
    if (Number.isFinite(p.mapY)) fields.push("mapY: " + Math.round(p.mapY));
    if (Number.isFinite(p.calloutAngle)) fields.push("calloutAngle: " + jsNumber(p.calloutAngle));
    if (Number.isFinite(p.calloutRadius)) fields.push("calloutRadius: " + jsNumber(p.calloutRadius));
    if (typeof p.approx === "boolean") fields.push("approx: " + (p.approx ? "true" : "false"));
    if (p.mapQuery) fields.push("mapQuery: " + jsString(p.mapQuery));
    if (p.url !== undefined) fields.push("url: " + (p.url ? jsString(p.url) : "null"));

    return "        { " + fields.join(", ") + " }";
  }
  function formatProfileForData(profile) {
    var paragraphs = Array.isArray(profile) ? profile : [profile];
    return [
      "      profile: [",
      paragraphs.map(function (copy) { return "        " + jsString(copy); }).join(",\n"),
      "      ],"
    ].join("\n");
  }
  function formatPixelsBlock() {
    var lines = ["  pixels: {"];
    D.forEach(function (d, i) {
      var p = PX[d.slug] || [W / 2, H / 2];
      lines.push("    " + jsString(d.slug) + ": [" + Math.round(p[0]) + ", " + Math.round(p[1]) + "]" + (i === D.length - 1 ? "" : ","));
    });
    lines.push("  },");
    return lines.join("\n");
  }
  function formatTourOrderBlock() {
    var order = orderedDistilleries().map(function (d) { return d.num; });
    return "  tourOrder: [" + order.join(", ") + "],";
  }
  function formatBrandBlock() {
    return [
      "  brand: {",
      "    ocean: " + jsString(DATA.brand.ocean) + ",",
      "    land: " + jsString(DATA.brand.land) + ",",
      "    star: " + jsString(DATA.brand.star) + ",",
      "    ink: " + jsString(DATA.brand.ink),
      "  },"
    ].join("\n");
  }
  function formatBasemapBlock() {
    var lines = [
      "  basemap: {",
      "    url: " + jsString(BM.url) + ",",
      "    w: " + jsNumber(BM.w) + ",",
      "    h: " + jsNumber(BM.h)
    ];

    if (BM.maskUrl) {
      lines[lines.length - 1] += ",";
      lines.push("    maskUrl: " + jsString(BM.maskUrl));
    }
    if (BM.decorations && BM.decorations.url) {
      lines[lines.length - 1] += ",";
      lines.push(
        "    decorations: {",
        "      url: " + jsString(BM.decorations.url) + ",",
        "      scale: " + jsNumber(BM.decorations.scale || 1) + ",",
        "      offsetX: " + jsNumber(BM.decorations.offsetX || 0) + ",",
        "      offsetY: " + jsNumber(BM.decorations.offsetY || 0) + ",",
        "      opacity: " + jsNumber(BM.decorations.opacity == null ? 1 : BM.decorations.opacity),
        "    }"
      );
    }

    lines.push("  },");
    return lines.join("\n");
  }
  function formatDistilleryForData(d, isLast) {
    var lines = [
      "    {",
      "      num: " + d.num + ", slug: " + jsString(d.slug) + ", name: " + jsString(d.name) + ",",
      "      lat: " + jsNumber(d.lat) + ", lng: " + jsNumber(d.lng) + ",",
      "      address: " + jsString(d.address) + ",",
      "      image: " + jsString(d.image) + ",",
      "      cardImage: " + jsString(d.cardImage) + ",",
      "      desc: " + jsString(d.desc) + ","
    ];

    if (d.profile) {
      lines.push(formatProfileForData(d.profile));
    }

    lines.push("      pois: [");
    d.pois.forEach(function (p, i) {
      lines.push(formatPoiForData(p) + (i === d.pois.length - 1 ? "" : ","));
    });
    lines.push("      ]");
    lines.push("    }" + (isLast ? "" : ","));
    return lines.join("\n");
  }
  function formatFullDataFile() {
    var lines = [
      "/* =============================================================================",
      " * CDANS Distillery Guide — Data",
      " * -----------------------------------------------------------------------------",
      " * Edit mode can export this full file. Replace assets/cdans-data.js with the",
      " * copied output so illustrated-map pixel positions stay in sync.",
      " * ========================================================================== */",
      "",
      "window.CDANS_DATA = {",
      formatBrandBlock(),
      "",
      "  /* Flat brand basemap (NS silhouette, stars stripped) + natural size. */",
      formatBasemapBlock(),
      "",
      "  /* slug -> [px, py] pixel position on the basemap (top-left origin) */",
      formatPixelsBlock(),
      "",
      "  /* Distillery nums in driving-tour order. */",
      formatTourOrderBlock(),
      "",
      "  distilleries: ["
    ];

    D.forEach(function (d, i) {
      lines.push(formatDistilleryForData(d, i === D.length - 1));
    });
    lines.push("  ]");
    lines.push("};");
    return lines.join("\n");
  }
  function toggleEdit() {
    editMode = !editMode;
    document.getElementById("cdans_editbtn").classList.toggle("is-on", editMode);
    document.getElementById("cdans_editbar").classList.toggle("is-on", editMode);
    Object.keys(starMarkers).forEach(function (s) {
      var m = starMarkers[s];
      if (editMode) { m.dragging.enable(); } else { m.dragging.disable(); }
    });
    poiLayer.eachLayer(function (layer) {
      if (layer instanceof L.Marker) {
        if (editMode) { layer.dragging.enable(); } else { layer.dragging.disable(); }
      }
    });
  }
  function copyCoords() {
    var txt = formatFullDataFile();
    var output = document.getElementById("cdans_editoutput");
    copyText(txt, output);
    document.getElementById("cdans_editbar").querySelector(".cdans_editbar_txt").textContent =
      "Copied full cdans-data.js. Replace the whole file with this export.";
    console.log("CDANS full data file export:\n" + txt);
  }
  function revealEditButton(focusButton) {
    var btn = document.getElementById("cdans_editbtn");
    if (!btn) return;

    btn.classList.remove("is-concealed");
    if (focusButton) btn.focus();
  }
  function isTypingTarget(target) {
    var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
    return tag === "input" || tag === "textarea" || tag === "select" || !!(target && target.isContentEditable);
  }
  function bindEditorShortcut() {
    document.addEventListener("keydown", function (e) {
      var key = e.key ? e.key.toLowerCase() : "";
      if (key !== "e" || !e.shiftKey || !(e.metaKey || e.ctrlKey) || isTypingTarget(e.target)) return;

      e.preventDefault();
      revealEditButton(true);
    });
  }

  /* --- Sidebar list + legend ------------------------------------------------ */
  function makeSidebarBadge(d) {
    return starAsset("cdans_item_badge_star") + '<span class="cdans_item_badge_num">' + d.num + "</span>";
  }

  function buildList() {
    var list = document.getElementById("cdans_list");
    list.innerHTML = "";

    if (!activeLayers.distillery) {
      var empty = el("div", "cdans_list_empty", "Distillery layer is toggled off.");
      list.appendChild(empty);
      return;
    }

    D.slice().sort(function (a, b) { return a.num - b.num; }).forEach(function (d) {
      var item = el("div", "cdans_item");
      item.setAttribute("data-slug", d.slug);
      if (d.slug === activeSlug) item.classList.add("is-active");

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

  function buildExploreList() {
    var list = document.getElementById("cdans_explore_list");
    if (!list) return;
    list.innerHTML = "";

    var allPois = [];
    D.forEach(function (d) {
      d.pois.forEach(function (p) {
        if (activeLayers[p.cat]) {
          allPois.push(p);
        }
      });
    });

    if (allPois.length === 0) {
      var empty = el("div", "cdans_list_empty", "No active categories matching stops.");
      list.appendChild(empty);
      return;
    }

    allPois.sort(function (a, b) {
      var catA = CAT_LABEL[a.cat] || a.cat;
      var catB = CAT_LABEL[b.cat] || b.cat;
      if (catA !== catB) return catA.localeCompare(catB);
      return a.name.localeCompare(b.name);
    });

    var currentCatGroup = null;

    allPois.forEach(function (p) {
      var catName = CAT_LABEL[p.cat] || p.cat;
      if (currentCatGroup !== catName) {
        currentCatGroup = catName;
        var header = el("div", "cdans_list_group_header", catName);
        list.appendChild(header);
      }

      var item = el("div", "cdans_item cdans_explore_item");
      item.setAttribute("data-parent-slug", p.parent.slug);
      if (p.parent.slug === activeSlug) item.classList.add("is-active-parent");

      var main = el("button", "cdans_item_main");
      main.type = "button";
      main.appendChild(el("span", "cdans_explore_badge cat-" + p.cat, catAsset(p.cat, "cdans_explore_badge_img")));

      var body = el("div", "cdans_item_body");
      body.appendChild(el("div", "cdans_item_name", p.name));
      var townStr = "Near " + p.parent.name;
      var distStr = poiDistanceStr(p);
      if (distStr) townStr += " • " + distStr;
      body.appendChild(el("div", "cdans_item_town", townStr));
      main.appendChild(body);

      item.appendChild(main);
      main.addEventListener("click", function () {
        selectDistillery(p.parent.slug, true);
        if (p.marker) {
          setTimeout(function () {
            p.marker.openPopup();
          }, 750);
        }
      });
      list.appendChild(item);
    });
  }

  function buildLegend() {
    var wrap = document.getElementById("cdans_legend");
    wrap.innerHTML = "";
    var items = [
      { id: "distillery", label: "Distillery", icon: starAsset("cdans_legend_img") },
      { id: "hike", label: "Trail", icon: catAsset("hike", "cdans_legend_img") },
      { id: "stay", label: "Stay", icon: catAsset("stay", "cdans_legend_img") },
      { id: "scenic", label: "Sightseeing", icon: catAsset("scenic", "cdans_legend_img") },
      { id: "food", label: "Food & Drink", icon: catAsset("food", "cdans_legend_img") }
    ];
    items.forEach(function (it) {
      var active = activeLayers[it.id];
      var n = el("button", "cdans_legend_item" + (active ? " is-active" : " is-inactive"));
      n.type = "button";
      n.setAttribute("data-cat", it.id);
      var chip = el("span", "cdans_legend_chip", it.icon);
      n.appendChild(chip);
      var labelSpan = el("span", "cdans_legend_label", it.label);
      n.appendChild(labelSpan);

      n.addEventListener("click", function () {
        activeLayers[it.id] = !activeLayers[it.id];
        n.classList.toggle("is-active", activeLayers[it.id]);
        n.classList.toggle("is-inactive", !activeLayers[it.id]);
        clearDistillerySelection(true);
        updateMapElements();
        buildList();
        buildExploreList();
      });

      wrap.appendChild(n);
    });
  }

  function switchTab(tab) {
    activeTab = tab;
    document.getElementById("cdans_tab_distilleries").classList.toggle("is-active", tab === "distilleries");
    document.getElementById("cdans_tab_explore").classList.toggle("is-active", tab === "explore");
    document.getElementById("cdans_list").style.display = (tab === "distilleries" ? "block" : "none");
    document.getElementById("cdans_explore_list").style.display = (tab === "explore" ? "block" : "none");
  }

  /* --- Init ----------------------------------------------------------------- */
  function init() {
    geoProjector = buildGeoProjector();

    // 1. Run layout for all distilleries and pre-cache POI layout properties
    initializePoiLayouts();

    // 2. Build Sidebar Lists & Legend
    buildLegend();
    buildList();
    buildExploreList();

    // 3. Tab switching listeners
    document.getElementById("cdans_tab_distilleries").addEventListener("click", function () {
      switchTab("distilleries");
    });
    document.getElementById("cdans_tab_explore").addEventListener("click", function () {
      switchTab("explore");
    });

    // 4. Initialize Map
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
      maxZoom: 6,
      inertia: true,
      inertiaDeceleration: 2600,
      inertiaMaxSpeed: 900,
      easeLinearity: 0.18,
      maxBoundsViscosity: 1.0 // rigid boundaries
    });

    L.imageOverlay(BM.url, bounds).addTo(map);
    if (BM.decorations && BM.decorations.url) {
      L.imageOverlay(BM.decorations.url, scaledMapBounds(BM.decorations), {
        opacity: BM.decorations.opacity == null ? 1 : BM.decorations.opacity,
        className: "cdans_map_background_icons"
      }).addTo(map);
    }

    map.fitBounds(bounds);
    overviewZoom = map.getBoundsZoom(bounds);
    map.setMinZoom(overviewZoom);
    map.setMaxBounds(bounds); // Lock completely to illustration bounds, no padding!

    tourLayer.addTo(map);
    routeLayer.addTo(map);
    poiLayer.addTo(map);
    buildFullTourControl().addTo(map);

    map.on("zoomend", function () {
      if (!smoothWheelActive) updateMapElements();
    });

    bindSmoothWheelZoom();
    loadMapMask();

    // 5. Create distillery markers
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
    bindEditorShortcut();
    bindProfileModalKeys();

    // 6. Start with the full map visible and no active distillery selection.
    updateMapElements();
    map.fitBounds(bounds);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
