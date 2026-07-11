// ==========================================================================
// CORE LAYOUT CONTROLLER PIPELINE
// ==========================================================================
document.addEventListener("DOMContentLoaded", function () {
    
    /* ----------------------------------------------------------------------
       MODULE A: 3D CARD INTERACTIVE TILT ENGINE
       ---------------------------------------------------------------------- */
    const dynamicCards = document.querySelectorAll("[data-tilt]");

    dynamicCards.forEach(card => {
        card.addEventListener("mousemove", function (e) {
            const cardBoundingBox = this.getBoundingClientRect();
            
            const cardWidth = cardBoundingBox.width;
            const cardHeight = cardBoundingBox.height;
            const centerX = cardBoundingBox.left + cardWidth / 2;
            const centerY = cardBoundingBox.top + cardHeight / 2;

            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            // Subtle rotation bounds for a sleek premium feel (Max 8 degrees)
            const rotateX = ((mouseY / cardHeight) * -8).toFixed(2);
            const rotateY = ((mouseX / cardWidth) * 8).toFixed(2);

            // Special handling to preserve the horizontal center alignment of the navbar
            if (this.classList.contains("topbar")) {
                this.style.transform = `translateX(-50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
            } else {
                this.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            }
        });

        card.addEventListener("mouseleave", function () {
            if (this.classList.contains("topbar")) {
                this.style.transform = `translateX(-50%) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            } else {
                this.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            }
        });
    });

    /* ----------------------------------------------------------------------
       MODULE B: INTERACTIVE PROFILE HUB TAB SWITCHER
       ---------------------------------------------------------------------- */
    const tabButtons = document.querySelectorAll(".tab-btn");
    const contentPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(button => {
        button.addEventListener("click", function () {
            const chosenTargetId = this.getAttribute("data-target");
            
            // 1. Reset active states on buttons and panels
            tabButtons.forEach(btn => btn.classList.remove("active"));
            contentPanels.forEach(panel => panel.classList.remove("active"));
            
            // 2. Activate current tab trigger
            this.classList.add("active");
            
            // 3. Fade and slide target panel into view
            const targetPanel = document.getElementById(chosenTargetId);
            if (targetPanel) {
                targetPanel.classList.add("active");
            }
        });
    });
});


// ==========================================================================
// MODULE C: LIGHTFALL WEBGL SHADER BACKGROUND CONTROLLER ENGINE
// ==========================================================================
(function() {
    const canvas = document.getElementById("lightfall-canvas");
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // Component Parameter Settings (Configured to match your theme style)
    const config = {
        speed: 0.3,
        streakCount: 3,
        streakWidth: 1.2,
        streakLength: 1.0,
        glow: 1.2,
        density: 0.5,
        twinkle: 0.8,
        zoom: 3.5,
        bgGlow: 0.4,
        opacity: 1.0,
        colors: [
            [0.06, 0.73, 0.51], // Emerald Accent: #10B981 equivalent rgb values
            [0.02, 0.40, 0.30], // Dark Teal Green blend
            [0.05, 0.11, 0.20]  // Deep space signature dark blue highlight
        ],
        bgColor: [0.02, 0.04, 0.08] // #050b14 deep primary space base color
    };

    // Calculate theme coordinate averages
    let avgColor = [0, 0, 0];
    config.colors.forEach(c => { avgColor[0] += c[0]; avgColor[1] += c[1]; avgColor[2] += c[2]; });
    avgColor = avgColor.map(v => v / config.colors.length);

    // Structural Geometry Shader source blueprints
    const vsSource = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        precision highp float;
        uniform vec3 iResolution;
        uniform vec2 iMouse;
        uniform float iTime;
        uniform vec3 uColor0; uniform vec3 uColor1; uniform vec3 uColor2;
        uniform vec3 uBgColor; uniform vec3 uMouseColor;
        uniform float uSpeed; uniform int uStreakCount; uniform float uStreakWidth;
        uniform float uStreakLength; uniform float uGlow; uniform float uDensity;
        uniform float uTwinkle; uniform float uZoom; uniform float uBgGlow;
        uniform float uOpacity;
        varying vec2 vUv;

        vec3 palette(float h) {
            if (h < 0.33) return uColor0;
            if (h < 0.66) return uColor1;
            return uColor2;
        }
        vec2 sceneC(vec2 frag, vec2 r) {
            vec2 P = (frag + frag - r) / r.x;
            float z = 0.0; float d = 1e3; vec4 O = vec4(0.0);
            for (int k = 0; k < 32; k++) {
                if (d <= 1e-4) break;
                O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
                d = 1.0 - sqrt(length(O * O)); z += d;
            }
            return vec2(O.x, atan(O.z, O.y));
        }
        void main() {
            vec2 r = iResolution.xy;
            vec2 fragCoord = vUv * r;
            vec2 uv0 = (fragCoord + fragCoord - r) / r.x;
            float T = 0.1 * iTime * uSpeed + 9.0;
            float angRings = max(1.0, floor(6.28318 * max(uDensity, 0.05) + 0.5));
            vec2 Y = vec2(5e-3, 6.28318 / angRings);

            vec2 c0 = sceneC(fragCoord, r);
            vec2 cdx = sceneC(fragCoord + vec2(1.0, 0.0), r);
            vec2 cdy = sceneC(fragCoord + vec2(0.0, 1.0), r);
            vec2 dCx = cdx - c0; vec2 dCy = cdy - c0;
            dCx.y -= 6.28318 * floor(dCx.y / 6.28318 + 0.5);
            dCy.y -= 6.28318 * floor(dCy.y / 6.28318 + 0.5);
            vec2 fw = abs(dCx) + abs(dCy);
            vec2 C = c0;

            vec2 P_bg = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
            vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P_bg, P_bg) + 6.0), 0.0);

            vec2 mN = (iMouse + iMouse - r) / r.x;
            float md = length(uv0 - mN);
            float mGlow = exp(-md * md / 1.0) * 0.5;
            O.rgb += uMouseColor * mGlow * 0.25;

            float zr = 5e-4 * uStreakWidth;
            vec2 rr = vec2(max(length(fw), 1e-5));
            float tail = 19.0 / max(uStreakLength, 0.05);

            for (int m = 0; m < 16; m++) {
                if (m >= uStreakCount) break;
                float jf = float(m) + 1.0;
                float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
                vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
                Pp -= floor(Pp / Y + 0.5) * Y;
                float h = fract(8663.0 * ic);
                vec3 col = palette(h);
                float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle) * (1.0 + mGlow * 2.0);
                vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
                vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
                O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
                C.x += Y.x / 8.0;
            }
            vec3 colr = sqrt(clamp((O.rgb * uGlow - vec3(0.04, 0.08, 0.02)), 0.0, 1.0));
            gl_FragColor = vec4(colr, uOpacity);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        res: gl.getUniformLocation(program, "iResolution"),
        mouse: gl.getUniformLocation(program, "iMouse"),
        time: gl.getUniformLocation(program, "iTime")
    };

    function setUniforms() {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor0"), config.colors[0]);
        gl.uniform3fv(gl.getUniformLocation(program, "uColor1"), config.colors[1]);
        gl.uniform3fv(gl.getUniformLocation(program, "uColor2"), config.colors[2]);
        gl.uniform3fv(gl.getUniformLocation(program, "uBgColor"), config.bgColor);
        gl.uniform3fv(gl.getUniformLocation(program, "uMouseColor"), avgColor);
        gl.uniform1f(gl.getUniformLocation(program, "uSpeed"), config.speed);
        gl.uniform1i(gl.getUniformLocation(program, "uStreakCount"), config.streakCount);
        gl.uniform1f(gl.getUniformLocation(program, "uStreakWidth"), config.streakWidth);
        gl.uniform1f(gl.getUniformLocation(program, "uStreakLength"), config.streakLength);
        gl.uniform1f(gl.getUniformLocation(program, "uGlow"), config.glow);
        gl.uniform1f(gl.getUniformLocation(program, "uDensity"), config.density);
        gl.uniform1f(gl.getUniformLocation(program, "uTwinkle"), config.twinkle);
        gl.uniform1f(gl.getUniformLocation(program, "uZoom"), config.zoom);
        gl.uniform1f(gl.getUniformLocation(program, "uBgGlow"), config.bgGlow);
        gl.uniform1f(gl.getUniformLocation(program, "uOpacity"), config.opacity);
    }
    setUniforms();

    let mouseX = 0, mouseY = 0;
    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = window.innerHeight - e.clientY;
    });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    window.addEventListener("resize", resize);
    resize();

    function render(time) {
        gl.uniform3f(uniforms.res, canvas.width, canvas.height, 1.0);
        gl.uniform2f(uniforms.mouse, mouseX, mouseY);
        gl.uniform1f(uniforms.time, time * 0.001);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
})();

// ==========================================================================
// MODULE D: SMOOTH SCROLL INTERPOLATION ENGINE (LERP) - STABILIZED
// ==========================================================================
window.currentScrollY = window.scrollY;
window.targetScrollY = window.scrollY;
window.isScrollMoving = false;

(function() {
    const easingFactor = 0.08; // Lower value = smoother glide, higher = faster stop

    // Listen to mouse wheel movements
    window.addEventListener("wheel", function(e) {
        e.preventDefault(); // Intercept browser hard snapping
        
        window.targetScrollY += e.deltaY;
        
        // Keep scroll parameters within strict webpage boundaries
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.targetScrollY = Math.max(0, Math.min(window.targetScrollY, maxScroll));

        triggerScrollLoop();
    }, { passive: false });

    // Global pipeline accelerator to start the animation frames safely
    window.triggerScrollLoop = function() {
        if (!window.isScrollMoving) {
            window.isScrollMoving = true;
            requestAnimationFrame(smoothScrollLoop);
        }
    };

    // Math Loop Engine
    function smoothScrollLoop() {
        window.currentScrollY += (window.targetScrollY - window.currentScrollY) * easingFactor;
        window.scrollTo(0, window.currentScrollY);

        if (Math.abs(window.targetScrollY - window.currentScrollY) > 0.4) {
            requestAnimationFrame(smoothScrollLoop);
        } else {
            window.currentScrollY = window.targetScrollY;
            window.isScrollMoving = false;
        }
    }

    // Sync variables if the visitor manually drags the physical browser scrollbar
    window.addEventListener("scroll", function() {
        if (!window.isScrollMoving) {
            window.currentScrollY = window.scrollY;
            window.targetScrollY = window.scrollY;
        }
    });
})();


// ==========================================================================
// MODULE E: TOPBAR SMART ANCHOR INTERCEPT & AUTO-TAB SWITCHER ROUTINE
// ==========================================================================
(function() {
    // Intercept clicks on ALL topbar links inside the right (.tr) wrapper section
    const navLinks = document.querySelectorAll('.tr a, .hero-actions a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            const targetTab = this.getAttribute('data-target-tab');
            
            if (targetElement) {
                // 1. Calculate target document height offset minus topbar height buffer (90px)
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - 90; 
                
                // 2. Safely feed target values directly to the scroll calculation engine
                window.targetScrollY = offsetPosition;
                window.triggerScrollLoop();

                // 3. Handle internal sub-tabs safely using an isolated macro-task delay
                if (targetTab) {
                    // Find the tab switcher button element inside the profile hub container
                    const correspondingButton = document.querySelector(`.tab-btn[data-target="${targetTab}"]`);
                    if (correspondingButton) {
                        setTimeout(() => {
                            correspondingButton.click();
                        }, 50); // Small delay lets scroll engine fire up completely beforehand
                    }
                }
            }
        });
    });
})();

// ==========================================================================
// MODULE G: ASYNCHRONOUS FORM SUBMISSION HANDLING (AJAX)
// ==========================================================================
(function() {
    const contactForm = document.getElementById("portfolio-contact-form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", function(e) {
        e.preventDefault(); // Stop page from redirecting or refreshing

        const submitBtn = contactForm.querySelector(".form-submit-btn");
        const originalBtnText = submitBtn.innerHTML;
        
        // Visual cue: Change button text to show transmission status
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;
        submitBtn.style.opacity = "0.7";
        submitBtn.disabled = true;

        const formData = new FormData(contactForm);

        // Send submission data to Web3Forms API in the background
        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Success feedback loop
                alert("Message sent successfully! I'll get back to you shortly.");
                contactForm.reset(); // Clear all fields cleanly
            } else {
                alert("Something went wrong: " + data.message);
            }
        })
        .catch(error => {
            console.error("Transmission error:", error);
            alert("Network connection error. Please try again.");
        })
        .finally(() => {
            // Restore button to its normal interactive state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.opacity = "1";
            submitBtn.disabled = false;
        });
    });
})();