/*
 * Progressive enhancement: upgrades the homepage's flat circular world map
 * into a rotating 3D WebGL globe (same texture, same marker data — read
 * straight off the existing .footprint DOM, nothing duplicated per locale).
 * Desktop only; falls back to the flat map untouched on any failure, on
 * mobile, or under prefers-reduced-motion.
 */
(function () {
  "use strict";

  function hasWebGL() {
    try {
      var canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // The country we work with the most should already be facing the visitor
  // on load, instead of them waiting for the slow auto-rotation to bring it
  // into view. Matched by coordinates (locale-independent) rather than by
  // label text.
  var FACE_ON_LOAD = { x: 81.20, y: 39.95 };

  function initGlobe() {
    var footprint = document.querySelector(".footprint");
    if (!footprint) return;
    if (window.innerWidth < 900) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof THREE === "undefined" || !hasWebGL()) return;

    var mapImg = footprint.querySelector(".footprint__map");
    var markerEls = footprint.querySelectorAll(".footprint__marker");
    if (!mapImg || !markerEls.length) return;

    var countries = [];
    markerEls.forEach(function (el, i) {
      var left = parseFloat(el.style.left);
      var top = parseFloat(el.style.top);
      var tooltipEl = el.querySelector(".tooltip");
      if (isNaN(left) || isNaN(top) || !tooltipEl) return;
      var tier = "md";
      if (el.classList.contains("footprint__marker--lg")) tier = "lg";
      else if (el.classList.contains("footprint__marker--sm")) tier = "sm";
      countries.push({ x: left, y: top, tier: tier, label: tooltipEl.textContent, phase: i * 0.6 });
    });
    if (!countries.length) return;

    try {
      buildScene(footprint, mapImg, countries);
    } catch (e) {
      // Any WebGL/runtime failure: leave the flat map exactly as it was.
    }
  }

  function buildScene(footprint, mapImg, countries) {
    var TIER_SIZE = { lg: 0.11, md: 0.085, sm: 0.068 };
    var GLOBE_R = 1;

    function latLonToVector3(lat, lon, radius) {
      var phi = (90 - lat) * (Math.PI / 180);
      var theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }
    function toLatLon(c) {
      return { lat: 90 - (c.y / 100) * 180, lon: (c.x / 100) * 360 - 180 };
    }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 2.7);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var texLoader = new THREE.TextureLoader();
    texLoader.load(
      mapImg.currentSrc || mapImg.src,
      function (mapTex) {
        mapTex.encoding = THREE.sRGBEncoding;

        var globeGroup = new THREE.Group();
        scene.add(globeGroup);

        var geometry = new THREE.SphereGeometry(GLOBE_R, 64, 64);
        var material = new THREE.MeshStandardMaterial({
          map: mapTex,
          emissive: new THREE.Color(0xc9a24b),
          emissiveMap: mapTex,
          emissiveIntensity: 0.55,
          color: new THREE.Color(0x2a2410),
          roughness: 0.85,
          metalness: 0.1
        });
        var globe = new THREE.Mesh(geometry, material);
        globeGroup.add(globe);

        var rimGeo = new THREE.SphereGeometry(GLOBE_R + 0.035, 64, 64);
        var rimMat = new THREE.ShaderMaterial({
          vertexShader: [
            "varying vec3 vNormal;",
            "void main() {",
            "  vNormal = normalize(normalMatrix * normal);",
            "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
          ].join("\n"),
          fragmentShader: [
            "varying vec3 vNormal;",
            "void main() {",
            "  float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);",
            "  gl_FragColor = vec4(0.79, 0.64, 0.30, 1.0) * intensity;",
            "}"
          ].join("\n"),
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true
        });
        var rim = new THREE.Mesh(rimGeo, rimMat);
        globeGroup.add(rim);

        scene.add(new THREE.AmbientLight(0x554015, 1.2));
        var key = new THREE.DirectionalLight(0xe3c785, 1.1);
        key.position.set(-3, 2, 3);
        scene.add(key);

        // marker sprites
        var dotCanvas = document.createElement("canvas");
        dotCanvas.width = dotCanvas.height = 64;
        var dctx = dotCanvas.getContext("2d");
        var grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,244,214,1)");
        grad.addColorStop(0.35, "rgba(227,199,133,0.9)");
        grad.addColorStop(1, "rgba(227,199,133,0)");
        dctx.fillStyle = grad;
        dctx.fillRect(0, 0, 64, 64);
        var dotTexture = new THREE.CanvasTexture(dotCanvas);

        var markers = countries.map(function (c) {
          var ll = toLatLon(c);
          var pos = latLonToVector3(ll.lat, ll.lon, GLOBE_R + 0.015);
          var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: dotTexture,
            color: 0xe3c785,
            transparent: true,
            depthWrite: false
          }));
          sprite.position.copy(pos);
          var base = TIER_SIZE[c.tier];
          sprite.scale.set(base, base, 1);
          sprite.userData = { label: c.label, baseScale: base, phase: c.phase };
          globeGroup.add(sprite);
          return sprite;
        });

        // face the highest-priority market on load instead of an arbitrary angle
        var closest = null, closestDist = Infinity;
        countries.forEach(function (c) {
          var d = Math.hypot(c.x - FACE_ON_LOAD.x, c.y - FACE_ON_LOAD.y);
          if (d < closestDist) { closestDist = d; closest = c; }
        });
        if (closest) {
          var ll0 = toLatLon(closest);
          var p0 = latLonToVector3(ll0.lat, ll0.lon, 1);
          globeGroup.rotation.y = -Math.atan2(p0.x, p0.z);
        }

        // swap the flat map for the live canvas only once everything above
        // succeeded and the texture is actually ready to paint
        footprint.querySelectorAll(".footprint__map, .footprint__marker").forEach(function (el) {
          el.style.display = "none";
        });
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.inset = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        footprint.style.pointerEvents = "auto";
        footprint.insertBefore(renderer.domElement, footprint.firstChild);

        var tooltip = document.createElement("div");
        tooltip.className = "footprint__globe-tooltip";
        footprint.parentNode.style.position = footprint.parentNode.style.position || "relative";
        footprint.appendChild(tooltip);

        var raycaster = new THREE.Raycaster();
        var pointerNDC = new THREE.Vector2();
        var hovered = null;

        function resize() {
          var rect = footprint.getBoundingClientRect();
          renderer.setSize(rect.width, rect.height, false);
        }
        resize();
        window.addEventListener("resize", resize);

        footprint.addEventListener("pointermove", function (evt) {
          var rect = footprint.getBoundingClientRect();
          var x = evt.clientX - rect.left;
          var y = evt.clientY - rect.top;
          pointerNDC.x = (x / rect.width) * 2 - 1;
          pointerNDC.y = -(y / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointerNDC, camera);
          var hits = raycaster.intersectObjects(markers, false);
          if (hits.length) {
            hovered = hits[0].object;
            tooltip.textContent = hovered.userData.label;
            tooltip.style.left = x + "px";
            tooltip.style.top = y + "px";
            tooltip.classList.add("is-visible");
          } else {
            hovered = null;
            tooltip.classList.remove("is-visible");
          }
        });
        footprint.addEventListener("pointerleave", function () {
          hovered = null;
          tooltip.classList.remove("is-visible");
        });

        var clock = new THREE.Clock();
        function animate() {
          requestAnimationFrame(animate);
          var t = clock.getElapsedTime();
          globeGroup.rotation.y += 0.0011;
          markers.forEach(function (m) {
            var pulse = 1 + 0.16 * Math.sin(t * 2 + m.userData.phase);
            var s = m.userData.baseScale * (m === hovered ? 1.35 : pulse);
            m.scale.set(s, s, 1);
          });
          renderer.render(scene, camera);
        }
        animate();
      },
      undefined,
      function () {
        // texture failed to load: flat map was never touched, nothing to undo
      }
    );
  }

  ready(initGlobe);
})();
