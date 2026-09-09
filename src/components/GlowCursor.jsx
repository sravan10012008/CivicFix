import { useEffect, useRef } from "react";

/**
 * GlowCursor — a premium pointer-following glow trail built on ogl.
 * Subtle, additive (screen blend) layer that sits behind page content.
 */
export default function GlowCursor({
  color = "#67E8F9",
  secondaryColor = "#A78BFA",
  trailLength = 40,
  trailWidth = 7,
  trailTaper = 0.8,
  followSpeed = 0.16,
  glowIntensity = 1.7,
  glowSpread = 1.2,
  hotspot = 0.65,
  brightness = 1.2,
  opacity = 0.85,
  pulseSpeed = 1.1,
  noiseStrength = 0.025,
  idleFade = true,
  idleTimeout = 700,
  fadeDuration = 900,
  blendMode = "screen",
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    let cleanup = () => {};

    (async () => {
      const OGL = await import("ogl");
      const { Renderer, Program, Mesh, Triangle, Vec2 } = OGL;

      const renderer = new Renderer({ alpha: true, premultipliedAlpha: false, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      mount.appendChild(gl.canvas);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      gl.canvas.style.display = "block";

      const geometry = new Triangle(gl);

      const uniforms = {
        uTime: { value: 0 },
        uColor: { value: color },
        uColor2: { value: secondaryColor },
        uTrailLength: { value: trailLength },
        uTrailWidth: { value: trailWidth },
        uTrailTaper: { value: trailTaper },
        uFollowSpeed: { value: followSpeed },
        uGlowIntensity: { value: glowIntensity },
        uGlowSpread: { value: glowSpread },
        uHotspot: { value: hotspot },
        uBrightness: { value: brightness },
        uOpacity: { value: opacity },
        uPulseSpeed: { value: pulseSpeed },
        uNoise: { value: noiseStrength },
        uResolution: { value: new Vec2(1, 1) },
        uMouse: { value: new Vec2(0, 0) },
        uMouseSmooth: { value: new Vec2(0, 0) },
        uActive: { value: 1 },
      };

      const program = new Program(gl, {
        vertex: `
          attribute vec2 position;
          varying vec2 vUv;
          void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `,
        fragment: `
          precision highp float;
          uniform float uTime;
          uniform vec3 uColor;
          uniform vec3 uColor2;
          uniform float uTrailLength;
          uniform float uTrailWidth;
          uniform float uTrailTaper;
          uniform float uFollowSpeed;
          uniform float uGlowIntensity;
          uniform float uGlowSpread;
          uniform float uHotspot;
          uniform float uBrightness;
          uniform float uOpacity;
          uniform float uPulseSpeed;
          uniform float uNoise;
          uniform vec2 uResolution;
          uniform vec2 uMouse;
          uniform vec2 uMouseSmooth;
          uniform float uActive;
          varying vec2 vUv;

          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

          void main(){
            vec2 px = vUv * uResolution;
            float res = max(uResolution.x, uResolution.y);

            // distance from current smooth pointer position
            float d = distance(px, uMouseSmooth) / res;

            // radial glow around the head
            float glow = exp(-d * d * 6.0 * uGlowSpread) * uGlowIntensity;

            // tapered trail toward the actual mouse
            float trail = smoothstep(uTrailWidth / res, 0.0, d) * uHotspot;
            float head = trail + glow;

            // color mix
            vec3 col = mix(uColor2, uColor, clamp(d * 3.0, 0.0, 1.0));
            col *= head;

            // subtle pulse
            col *= (0.9 + 0.1 * sin(uTime * uPulseSpeed));

            // light noise grain
            float n = (hash(vUv * uResolution + uTime) - 0.5) * uNoise;
            col += n;

            col *= uBrightness * uOpacity * uActive;
            gl_FragColor = vec4(col, head * uActive);
          }
        `,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        renderer.setSize(w, h);
        uniforms.uResolution.value.set(w, h);
        // store pixel-space mouse
        uniforms.uMouse.value.set(uniforms.uMouse.value.x, uniforms.uMouse.value.y);
      };
      resize();
      window.addEventListener("resize", resize);

      let lastMove = performance.now();
      const onMove = (e) => {
        const rect = mount.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = rect.height - (e.clientY - rect.top); // flip y
        uniforms.uMouse.value.set(x, y);
        lastMove = performance.now();
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      let raf;
      const start = performance.now();
      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        uniforms.uTime.value = (now - start) / 1000;

        // ease the smooth pointer toward the real pointer
        const target = uniforms.uMouse.value;
        const sm = uniforms.uMouseSmooth.value;
        sm.x += (target.x - sm.x) * followSpeed;
        sm.y += (target.y - sm.y) * followSpeed;

        // idle fade
        if (idleFade) {
          const idle = (now - lastMove) / 1000;
          let targetActive = 1;
          if (idle > idleTimeout / 1000) {
            const t = Math.min(1, ((idle - idleTimeout / 1000) * 1000) / fadeDuration);
            targetActive = 1 - t;
          }
          uniforms.uActive.value += (targetActive - uniforms.uActive.value) * 0.08;
        }

        renderer.render({ scene: mesh });
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        gl.getExtension("WEBGL_lose_context") && gl.getExtension("WEBGL_lose_context").loseContext();
        if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className="glow-cursor-layer" style={{ mixBlendMode: blendMode }} aria-hidden="true" />;
}