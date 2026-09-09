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
    var GLOBE_R = 1.7;

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

    // big, close, right/bottom-anchored — the frame catches the curved limb
    // of the planet rather than a small full ball floating in space
    var GLOBE_POS = new THREE.Vector3(1.65, -0.6, 0);

    var scene = new THREE.Scene();
    var rect = container.getBoundingClientRect();
    var camera = new THREE.PerspectiveCamera(35, rect.width / Math.max(rect.height, 1), 0.1, 100);
    camera.position.set(0, 0, 2.6);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width, rect.height);

    var texLoader = new THREE.TextureLoader();
    texLoader.load(
      mapImg.currentSrc || mapImg.src,
      function (mapTex) {
        mapTex.encoding = THREE.sRGBEncoding;

        var globeGroup = new THREE.Group();
        // large, close, bleeding past the frame edge — a deliberate graphic
        // object rather than a small ball floating centered in space
        globeGroup.position.copy(GLOBE_POS);
        scene.add(globeGroup);

        var geometry = new THREE.SphereGeometry(GLOBE_R, 64, 64);
        var material = new THREE.MeshStandardMaterial({
          map: mapTex,
          emissive: new THREE.Color(0xc9a24b),
          emissiveMap: mapTex,
          emissiveIntensity: 0.32,
          color: new THREE.Color(0x0c0904),
          roughness: 0.9,
          metalness: 0.05
        });
        var globe = new THREE.Mesh(geometry, material);
        globeGroup.add(globe);

        // atmosphere glow — a separate, non-rotating shell (a rotating rim
        // would spin the directional "sunrise" bias with it) biased toward
        // one side like backlit atmosphere, instead of a uniform ring
        var rimGeo = new THREE.SphereGeometry(GLOBE_R + 0.06, 64, 64);
        var rimMat = new THREE.ShaderMaterial({
          uniforms: {
            topColor: { value: new THREE.Color(0xf3a44e) },
            bottomColor: { value: new THREE.Color(0x8c5a1e) }
          },
          vertexShader: [
            "varying vec3 vNormal;",
            "void main() {",
            "  vNormal = normalize(normalMatrix * normal);",
            "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
          ].join("\n"),
          fragmentShader: [
            "varying vec3 vNormal;",
            "uniform vec3 topColor;",
            "uniform vec3 bottomColor;",
            "void main() {",
            "  float fresnel = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);",
            "  vec3 rimColor = mix(bottomColor, topColor, smoothstep(-0.6, 0.9, vNormal.y));",
            "  gl_FragColor = vec4(rimColor, 1.0) * fresnel;",
            "}"
          ].join("\n"),
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true
        });
        var rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.copy(GLOBE_POS);
        scene.add(rim);

        scene.add(new THREE.AmbientLight(0x2c2210, 1));
        var key = new THREE.DirectionalLight(0xe3c785, 0.9);
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

        // marker sprites — a crisp solid dot with a thin halo, not a soft
        // blurred blob
        var dotCanvas = document.createElement("canvas");
        dotCanvas.width = dotCanvas.height = 64;
        var dctx = dotCanvas.getContext("2d");
        var grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,248,228,1)");
        grad.addColorStop(0.22, "rgba(255,248,228,1)");
        grad.addColorStop(0.32, "rgba(227,199,133,0.95)");
        grad.addColorStop(0.55, "rgba(227,199,133,0.28)");
        grad.addColorStop(1, "rgba(227,199,133,0)");
        dctx.fillStyle = grad;
        dctx.fillRect(0, 0, 64, 64);
        var dotTexture = new THREE.CanvasTexture(dotCanvas);

        // persistent floating labels only for the primary markets, echoing
        // the reference's always-on country tags instead of hover-only
        var LABELED_TIERS = { lg: true, md: true };

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
          var base = TIER_SIZE[c.tier] * 0.8;
          sprite.scale.set(base, base, 1);
          sprite.userData = { label: c.label, baseScale: base, phase: c.phase };

          if (LABELED_TIERS[c.tier]) {
            var tag = document.createElement("div");
            tag.className = "footprint__globe-tag";
            tag.textContent = c.label.split(" — ")[0].split(" (")[0];
            sprite.userData.tag = tag;
          }

          globeGroup.add(sprite);
          return sprite;
        });

        // a few glowing "flight path" arcs from the home market outward —
        // matched by coordinates (locale-independent), same trick as
        // FACE_ON_LOAD above
        var HUB_COORD = { x: 68.48, y: 39.60 }; // Uzbekistan
        var ROUTE_TARGETS = [
          { x: 58.67, y: 39.95 }, // Turkey
          { x: 81.20, y: 39.95 }, // China
          { x: 49.80, y: 37.03 }  // United Kingdom
        ];
        function nearestCountry(ref) {
          var best = null, bestDist = Infinity;
          countries.forEach(function (c) {
            var d = Math.hypot(c.x - ref.x, c.y - ref.y);
            if (d < bestDist) { bestDist = d; best = c; }
          });
          return best;
        }
        var hub = nearestCountry(HUB_COORD);
        var pulses = [];
        if (hub) {
          var hubPos = latLonToVector3(toLatLon(hub).lat, toLatLon(hub).lon, GLOBE_R);
          ROUTE_TARGETS.forEach(function (target, ri) {
            var dest = nearestCountry(target);
            if (!dest || dest === hub) return;
            var destPos = latLonToVector3(toLatLon(dest).lat, toLatLon(dest).lon, GLOBE_R);

            var lifted = [];
            var segments = 48;
            for (var i = 0; i <= segments; i++) {
              var t = i / segments;
              var p = new THREE.Vector3().lerpVectors(hubPos, destPos, t);
              p.normalize();
              var lift = 1 + Math.sin(Math.PI * t) * 0.24;
              p.multiplyScalar(GLOBE_R * lift);
              lifted.push(p);
            }
            var curve = new THREE.CatmullRomCurve3(lifted);
            var lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
            var lineMat = new THREE.LineBasicMaterial({ color: 0xe3c785, transparent: true, opacity: 0.32 });
            globeGroup.add(new THREE.Line(lineGeo, lineMat));

            var pulseSprite = new THREE.Sprite(new THREE.SpriteMaterial({
              map: dotTexture,
              color: 0xfff4d6,
              transparent: true,
              depthWrite: false
            }));
            pulseSprite.scale.set(0.045, 0.045, 1);
            globeGroup.add(pulseSprite);
            pulses.push({ curve: curve, sprite: pulseSprite, offset: ri / ROUTE_TARGETS.length, speed: 0.09 });
          });
        }

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
        var glow = document.createElement("div");
        glow.className = "hero__globe-glow";
        layer.appendChild(glow);
        layer.appendChild(renderer.domElement);
        if (heroInner) {
          container.insertBefore(layer, heroInner);
        } else {
          container.appendChild(layer);
        }

        var tooltip = document.createElement("div");
        tooltip.className = "footprint__globe-tooltip";
        layer.appendChild(tooltip);

        markers.forEach(function (m) {
          if (m.userData.tag) layer.appendChild(m.userData.tag);
        });

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

        var tagProjected = new THREE.Vector3();
        var tagRect;

        var clock = new THREE.Clock();
        function animate() {
          requestAnimationFrame(animate);
          var t = clock.getElapsedTime();
          globeGroup.rotation.y += 0.0011;
          tagRect = container.getBoundingClientRect();
          markers.forEach(function (m) {
            var pulse = 1 + 0.16 * Math.sin(t * 2 + m.userData.phase);
            var s = m.userData.baseScale * (m === hovered ? 1.35 : pulse);
            m.scale.set(s, s, 1);

            if (m.userData.tag) {
              var dir = m.position.clone().normalize();
              var rotatedZ = -dir.x * Math.sin(globeGroup.rotation.y) + dir.z * Math.cos(globeGroup.rotation.y);
              if (rotatedZ > 0.08) {
                tagProjected.copy(m.getWorldPosition(new THREE.Vector3())).project(camera);
                var tx = (tagProjected.x * 0.5 + 0.5) * tagRect.width;
                var ty = (-tagProjected.y * 0.5 + 0.5) * tagRect.height;
                m.userData.tag.style.transform = "translate(" + tx.toFixed(1) + "px, " + ty.toFixed(1) + "px) translate(-50%, calc(-100% - 10px))";
                m.userData.tag.classList.add("is-visible");
              } else {
                m.userData.tag.classList.remove("is-visible");
              }
            }
          });
          pulses.forEach(function (p) {
            var ct = (t * p.speed + p.offset) % 1;
            p.sprite.position.copy(p.curve.getPointAt(ct));
            var fade = Math.sin(ct * Math.PI);
            p.sprite.material.opacity = 0.15 + 0.75 * fade;
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
