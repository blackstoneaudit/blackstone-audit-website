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

    var container = footprint.parentNode; // .hero .container
    var heroInner = container.querySelector(".hero__inner");
    var mapImg = footprint.querySelector(".footprint__map");
    var markerEls = footprint.querySelectorAll(".footprint__marker");
    if (!container || !mapImg || !markerEls.length) return;

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
      buildScene(footprint, container, heroInner, mapImg, countries);
    } catch (e) {
      // Any WebGL/runtime failure: leave the flat map exactly as it was.
    }
  }

  function buildScene(footprint, container, heroInner, mapImg, countries) {
    var TIER_SIZE = { lg: 0.11, md: 0.085, sm: 0.068 };
    var GLOBE_R = 1.35;

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

    var layer = document.createElement("div");
    layer.className = "hero__globe-layer";

    var scene = new THREE.Scene();
    var rect = container.getBoundingClientRect();
    var camera = new THREE.PerspectiveCamera(35, rect.width / Math.max(rect.height, 1), 0.1, 100);
    camera.position.set(0, 0, 4.2);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width, rect.height);

    var texLoader = new THREE.TextureLoader();
    texLoader.load(
      mapImg.currentSrc || mapImg.src,
      function (mapTex) {
        mapTex.encoding = THREE.sRGBEncoding;

        var globeGroup = new THREE.Group();
        // large, right-anchored, bleeding past the frame edge — a deliberate
        // graphic object rather than a small clipped inset
        globeGroup.position.set(1.15, 0, 0);
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

        var rimGeo = new THREE.SphereGeometry(GLOBE_R + 0.05, 64, 64);
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

        // faint static starfield behind the globe — doesn't rotate with it
        var STAR_COUNT = 220;
        var starPositions = new Float32Array(STAR_COUNT * 3);
        for (var si = 0; si < STAR_COUNT; si++) {
          var r = 6 + Math.random() * 6;
          var a1 = Math.random() * Math.PI * 2;
          var a2 = Math.acos(2 * Math.random() - 1);
          starPositions[si * 3] = r * Math.sin(a2) * Math.cos(a1);
          starPositions[si * 3 + 1] = r * Math.sin(a2) * Math.sin(a1);
          starPositions[si * 3 + 2] = -Math.abs(r * Math.cos(a2)) - 2;
        }
        var starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        var starMat = new THREE.PointsMaterial({ color: 0xcfc6ad, size: 0.02, transparent: true, opacity: 0.5 });
        scene.add(new THREE.Points(starGeo, starMat));

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
          var pos = latLonToVector3(ll.lat, ll.lon, GLOBE_R + 0.02);
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

        // swap the flat circular map for the live canvas only once everything
        // above succeeded and the texture is actually ready to paint
        footprint.style.display = "none";
        layer.appendChild(renderer.domElement);
        if (heroInner) {
          container.insertBefore(layer, heroInner);
        } else {
          container.appendChild(layer);
        }

        var tooltip = document.createElement("div");
        tooltip.className = "footprint__globe-tooltip";
        layer.appendChild(tooltip);

        var raycaster = new THREE.Raycaster();
        var pointerNDC = new THREE.Vector2();
        var hovered = null;

        function resize() {
          var r = container.getBoundingClientRect();
          camera.aspect = r.width / Math.max(r.height, 1);
          camera.updateProjectionMatrix();
          renderer.setSize(r.width, r.height);
        }
        resize();
        window.addEventListener("resize", resize);

        layer.addEventListener("pointermove", function (evt) {
          var r = container.getBoundingClientRect();
          var x = evt.clientX - r.left;
          var y = evt.clientY - r.top;
          pointerNDC.x = (x / r.width) * 2 - 1;
          pointerNDC.y = -(y / r.height) * 2 + 1;
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
        layer.addEventListener("pointerleave", function () {
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
