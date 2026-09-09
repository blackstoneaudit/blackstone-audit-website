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
    if (window.innerWidth < 320) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof THREE === "undefined" || !hasWebGL()) return;

    var innerContainer = footprint.parentNode; // .hero .container
    var hero = footprint.closest(".hero");
    var contentBlock = innerContainer.querySelector(".hero__inner");
    var mapImg = footprint.querySelector(".footprint__map");
    var markerEls = footprint.querySelectorAll(".footprint__marker");
    if (!hero || !innerContainer || !mapImg || !markerEls.length) return;

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
      buildScene(footprint, hero, innerContainer, mapImg, countries);
    } catch (e) {
      // Any WebGL/runtime failure: leave the flat map exactly as it was.
    }
  }

  // `container` here is the full .hero section, not the narrower
  // max-width .container inside it — mounting to the wider element means
  // the canvas has room to fade out before hitting its own edge instead of
  // ending in a visible seam against the plain hero background at wide
  // viewports.
  function buildScene(footprint, container, innerContainer, mapImg, countries) {
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

    var scene = new THREE.Scene();
    var rect = container.getBoundingClientRect();
    var aspect = rect.width / Math.max(rect.height, 1);
    var isNarrow = aspect < 1.05;

    // big and close — the frame catches the curved limb of the planet,
    // but pulled back enough to still show black space and stars around it.
    // On a narrow/portrait screen the horizontal FOV is much tighter, so an
    // offset this large would push the globe almost entirely off-screen —
    // bring it back toward center and a bit closer instead.
    var GLOBE_POS = isNarrow
      ? new THREE.Vector3(0.62, -0.02, 0)
      : new THREE.Vector3(2.2, 0.16, 0);

    // a portrait aspect makes the horizontal FOV much tighter than the
    // vertical one at the same fov value, so up close the sphere's surface
    // fills the frame edge-to-edge with no visible curvature — like
    // standing with your face against a wall. A wider fov keeps enough
    // horizontal field of view to actually see the globe's shape.
    var camera = new THREE.PerspectiveCamera(isNarrow ? 55 : 35, aspect, 0.1, 100);
    camera.position.set(0, 0, isNarrow ? 4.8 : 5.5);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isNarrow ? 1.5 : 2));
    renderer.setSize(rect.width, rect.height);

    function proceed() {
      buildWithImage(mapImg);
    }
    if (mapImg.complete && mapImg.naturalWidth) {
      proceed();
    } else {
      mapImg.addEventListener("load", proceed, { once: true });
      mapImg.addEventListener("error", function () {
        // image failed to load: flat map was never touched, nothing to undo
      }, { once: true });
    }

    function buildWithImage(img) {
        var globeGroup = new THREE.Group();
        // large, close, bleeding past the frame edge — a deliberate graphic
        // object rather than a small ball floating centered in space
        globeGroup.position.copy(GLOBE_POS);
        scene.add(globeGroup);

        var geometry = new THREE.SphereGeometry(GLOBE_R, 64, 64);
        var material = new THREE.MeshStandardMaterial({
          emissive: new THREE.Color(0x2a1f0c),
          emissiveIntensity: 0.5,
          color: new THREE.Color(0x0a0704),
          roughness: 0.92,
          metalness: 0.05
        });
        var globe = new THREE.Mesh(geometry, material);
        globeGroup.add(globe);

        // continents as an actual point cloud sampled from the existing
        // dot-matrix map asset (its dots live in the alpha channel), instead
        // of a texture baked onto the sphere — crisp individual points at
        // any zoom, matching a genuine "data globe" render technique
        (function buildContinentPoints() {
          var sampleCanvas = document.createElement("canvas");
          sampleCanvas.width = img.naturalWidth;
          sampleCanvas.height = img.naturalHeight;
          var sctx = sampleCanvas.getContext("2d");
          sctx.drawImage(img, 0, 0);
          var w = sampleCanvas.width, h = sampleCanvas.height;
          var data;
          try {
            data = sctx.getImageData(0, 0, w, h).data;
          } catch (e) {
            return; // cross-origin canvas read blocked: skip points, keep plain sphere
          }
          var stride = isNarrow ? 2 : 1;
          var positions = [];
          for (var py = 0; py < h; py += stride) {
            for (var px = 0; px < w; px += stride) {
              var idx = (py * w + px) * 4;
              var alpha = data[idx + 3];
              if (alpha > 40) {
                var lon = (px / w) * 360 - 180;
                var lat = 90 - (py / h) * 180;
                var p = latLonToVector3(lat, lon, GLOBE_R + 0.006);
                positions.push(p.x, p.y, p.z);
              }
            }
          }
          var geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
          var mat = new THREE.PointsMaterial({
            color: 0xe3c785,
            size: 0.010,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
          });
          globeGroup.add(new THREE.Points(geo, mat));
        })();

        // atmosphere glow — two non-rotating shells (a rotating rim would
        // spin the top/bottom bias with it): a tight bright core plus a
        // larger, softer halo layered behind it to fake a bloom pass
        function makeRimMesh(radiusPad, fresnelPow, opacity) {
          var geo = new THREE.SphereGeometry(GLOBE_R + radiusPad, 64, 64);
          var mat = new THREE.ShaderMaterial({
            uniforms: {
              topColor: { value: new THREE.Color(0xf6b05e) },
              bottomColor: { value: new THREE.Color(0x8c5a1e) },
              uOpacity: { value: opacity }
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
              "uniform float uOpacity;",
              "void main() {",
              "  float fresnel = clamp(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);",
              "  fresnel = pow(fresnel, " + fresnelPow.toFixed(1) + ");",
              "  vec3 rimColor = mix(bottomColor, topColor, smoothstep(-0.6, 0.9, vNormal.y));",
              "  gl_FragColor = vec4(rimColor, 1.0) * fresnel * uOpacity;",
              "}"
            ].join("\n"),
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
          });
          var mesh = new THREE.Mesh(geo, mat);
          mesh.position.copy(GLOBE_POS);
          return mesh;
        }
        scene.add(makeRimMesh(0.05, 2.6, 1.0));
        scene.add(makeRimMesh(0.2, 1.8, 0.5));

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

        // pulse/arc sprite texture — soft glow, used for the flight-path
        // pulses where a blurred look is wanted
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

        // marker sprite texture — small, solid, flat dot (like a pin), not
        // a glowing blob
        var markerCanvas = document.createElement("canvas");
        markerCanvas.width = markerCanvas.height = 64;
        var mctx = markerCanvas.getContext("2d");
        var mgrad = mctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        mgrad.addColorStop(0, "rgba(255,244,214,1)");
        mgrad.addColorStop(0.55, "rgba(227,199,133,1)");
        mgrad.addColorStop(0.72, "rgba(227,199,133,0.65)");
        mgrad.addColorStop(1, "rgba(227,199,133,0)");
        mctx.fillStyle = mgrad;
        mctx.fillRect(0, 0, 64, 64);
        var markerTexture = new THREE.CanvasTexture(markerCanvas);

        // persistent floating labels only for the primary markets, echoing
        // the reference's always-on country tags instead of hover-only
        var LABELED_TIERS = { lg: true, md: true };

        var markers = countries.map(function (c) {
          var ll = toLatLon(c);
          var pos = latLonToVector3(ll.lat, ll.lon, GLOBE_R + 0.02);
          var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: markerTexture,
            color: 0xe3c785,
            transparent: true,
            depthWrite: false
          }));
          sprite.position.copy(pos);
          var base = TIER_SIZE[c.tier] * 0.5;
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
          { x: 49.80, y: 37.03 }, // United Kingdom
          { x: 57.44, y: 56.47 }  // South Africa
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
        layer.appendChild(renderer.domElement);
        if (innerContainer) {
          container.insertBefore(layer, innerContainer);
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

        function updateHover(x, y) {
          var r = container.getBoundingClientRect();
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
        }

        // drag-to-rotate — hold and spin the globe in any direction; it
        // keeps coasting on release and eases back into the slow ambient
        // spin once it settles
        var MAX_TILT = 0.85;
        var isDragging = false;
        var dragLastX = 0, dragLastY = 0;
        var dragVelX = 0, dragVelY = 0;
        var canvasEl = renderer.domElement;
        canvasEl.style.cursor = "grab";
        canvasEl.style.touchAction = "none";

        layer.addEventListener("pointerdown", function (evt) {
          isDragging = true;
          dragLastX = evt.clientX;
          dragLastY = evt.clientY;
          dragVelX = 0;
          dragVelY = 0;
          hovered = null;
          tooltip.classList.remove("is-visible");
          canvasEl.style.cursor = "grabbing";
          if (canvasEl.setPointerCapture) {
            try { canvasEl.setPointerCapture(evt.pointerId); } catch (e) {}
          }
        });

        layer.addEventListener("pointermove", function (evt) {
          var r = container.getBoundingClientRect();
          var x = evt.clientX - r.left;
          var y = evt.clientY - r.top;

          if (isDragging) {
            var dx = evt.clientX - dragLastX;
            var dy = evt.clientY - dragLastY;
            dragLastX = evt.clientX;
            dragLastY = evt.clientY;
            var sensitivity = 0.0045;
            dragVelY = dx * sensitivity;
            dragVelX = dy * sensitivity;
            globeGroup.rotation.y += dragVelY;
            globeGroup.rotation.x = Math.max(-MAX_TILT, Math.min(MAX_TILT, globeGroup.rotation.x + dragVelX));
            return;
          }
          updateHover(x, y);
        });

        function endDrag() {
          if (!isDragging) return;
          isDragging = false;
          canvasEl.style.cursor = "grab";
        }
        layer.addEventListener("pointerup", endDrag);
        layer.addEventListener("pointercancel", endDrag);
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

          if (isDragging) {
            // rotation already applied directly in the pointermove handler
          } else if (Math.abs(dragVelX) > 0.00005 || Math.abs(dragVelY) > 0.00005) {
            // coast on released momentum, decaying each frame
            dragVelX *= 0.94;
            dragVelY *= 0.94;
            globeGroup.rotation.y += dragVelY;
            globeGroup.rotation.x = Math.max(-MAX_TILT, Math.min(MAX_TILT, globeGroup.rotation.x + dragVelX));
          } else {
            // settle back to the slow ambient spin, and ease any manual
            // tilt back toward level so it doesn't stay stuck sideways
            globeGroup.rotation.y += 0.0011;
            globeGroup.rotation.x *= 0.98;
          }
          tagRect = container.getBoundingClientRect();
          markers.forEach(function (m) {
            var pulse = 1 + 0.16 * Math.sin(t * 2 + m.userData.phase);
            var s = m.userData.baseScale * (m === hovered ? 1.35 : pulse);
            m.scale.set(s, s, 1);

            if (m.userData.tag) {
              var dir = m.position.clone().normalize();
              var rotatedZ = -dir.x * Math.sin(globeGroup.rotation.y) + dir.z * Math.cos(globeGroup.rotation.y);
              tagProjected.copy(m.getWorldPosition(new THREE.Vector3())).project(camera);
              // rotatedZ is an approximation (it ignores the camera's x-offset
              // from the globe's center), so it stays permissive near the
              // silhouette edge — a marker just past "front-facing" can still
              // project far outside the visible globe. Require a healthy
              // margin AND a projected position still reasonably on-screen.
              var onScreen = Math.abs(tagProjected.x) < 0.85 && Math.abs(tagProjected.y) < 0.85;
              if (rotatedZ > 0.35 && onScreen) {
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
    }
  }

  ready(initGlobe);
})();
