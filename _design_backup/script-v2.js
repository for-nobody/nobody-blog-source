/* ==============================================
   nobody-lab — 交互逻辑引擎 v3.0
   按钮规范强制绑定：所有 HTML 中的按钮必须遵从此规范
   优化：单全局监听 + rAF 空闲暂停 + prefers-color-scheme
   ============================================== */

// =========================================================================
// 宇宙引力吸附系统 (Magnetic Gravity Engine) - v3 单监听优化版
// =========================================================================

class MagneticPlanet {
    constructor(element, options = {}) {
        this.el = element;
        this.isActive = false;

        const rect = this.el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const isHeavy = area > 20000;

        this.triggerArea = options.triggerArea || (isHeavy ? 40 : 30);
        this.magneticForce = options.magneticForce || (isHeavy ? 0.04 : 0.12);
        this.stiffness = options.stiffness || (isHeavy ? 0.04 : 0.08);
        this.friction = options.friction || (isHeavy ? 0.85 : 0.78);
        this.hoverScale = options.hoverScale || (isHeavy ? 1.005 : 1.015);

        this.pos = { x: 0, y: 0 };
        this.vel = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.scale = { current: 1, target: 1, vel: 0 };

        // 将 transform 从 CSS 动画接管列表中剔除
        this.el.style.transitionProperty =
            "width, height, border-radius, background, background-color, box-shadow, color, opacity";
    }

    /** 由全局监听调用，传入当前鼠标位置 */
    updateGravity(mouseX, mouseY) {
        if (this.el.classList.contains("active")) {
            this.isActive = false;
            this.target.x = 0;
            this.target.y = 0;
            this.scale.target = 1;
            return;
        }

        const rect = this.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = mouseX - cx;
        const dy = mouseY - cy;

        const distX = Math.max(0, Math.abs(dx) - rect.width / 2);
        const distY = Math.max(0, Math.abs(dy) - rect.height / 2);
        const distToEdge = Math.sqrt(distX * distX + distY * distY);

        if (distToEdge < this.triggerArea) {
            this.isActive = true;
            this.target.x = dx * this.magneticForce;
            this.target.y = dy * this.magneticForce;
            this.scale.target = distToEdge === 0 ? this.hoverScale : 1;
        } else {
            this.isActive = false;
            this.target.x = 0;
            this.target.y = 0;
            this.scale.target = 1;
        }
    }

    render() {
        const forceX = (this.target.x - this.pos.x) * this.stiffness;
        this.vel.x += forceX;
        this.vel.x *= this.friction;
        this.pos.x += this.vel.x;

        const forceY = (this.target.y - this.pos.y) * this.stiffness;
        this.vel.y += forceY;
        this.vel.y *= this.friction;
        this.pos.y += this.vel.y;

        const forceScale = (this.scale.target - this.scale.current) * (this.stiffness * 1.5);
        this.scale.vel += forceScale;
        this.scale.vel *= (this.friction * 0.85);
        this.scale.current += this.scale.vel;

        if (this.isActive || this.isAnimating()) {
            this.el.style.transform =
                `translate3d(${this.pos.x}px, ${this.pos.y}px, 0) scale(${this.scale.current})`;
            return true;
        }

        // 🔧 Bug 修复：动画结束后清除残留的内联 transform，使 CSS hover 效果恢复正常
        this.el.style.transform = "";
        return false;
    }

    isAnimating() {
        return (
            Math.abs(this.vel.x) > 0.01 ||
            Math.abs(this.vel.y) > 0.01 ||
            Math.abs(this.target.x - this.pos.x) > 0.01 ||
            Math.abs(this.scale.vel) > 0.001
        );
    }
}

// =========================================================================
// Morph 菜单系统
// =========================================================================

function initializeMorphMenus() {
    const morphContainers = document.querySelectorAll(".morph-container");

    morphContainers.forEach((menu) => {
        menu.addEventListener("click", (e) => {
            if (e.target.closest(".morph-menu-item")) return;

            const parentCard = menu.closest(".glass-card");

            if (!menu.classList.contains("active")) {
                morphContainers.forEach((m) => {
                    if (m !== menu && m.classList.contains("active")) {
                        m.classList.remove("active");
                        const mCard = m.closest(".glass-card");
                        if (mCard) {
                            setTimeout(() => {
                                if (!m.classList.contains("active")) {
                                    mCard.classList.remove("card-active");
                                }
                            }, 400);
                        }
                    }
                });

                menu.classList.add("active");
                if (parentCard) parentCard.classList.add("card-active");
            }
        });
    });

    document.addEventListener("click", (e) => {
        morphContainers.forEach((menu) => {
            if (!menu.contains(e.target) && menu.classList.contains("active")) {
                menu.classList.remove("active");
                const parentCard = menu.closest(".glass-card");
                if (parentCard) {
                    setTimeout(() => {
                        if (!menu.classList.contains("active")) {
                            parentCard.classList.remove("card-active");
                        }
                    }, 400);
                }
            }
        });
    });
}

// =========================================================================
// DOMContentLoaded 主入口
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. 粒子背景（移动端减半）
    // ==========================================
    const particlesContainer = document.getElementById("particlesContainer");
    if (particlesContainer) {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const particleCount = isMobile ? 40 : 80;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.classList.add("star-particle");
            particle.style.left = Math.random() * 100 + "%";
            particle.style.top = Math.random() * 100 + "%";
            particle.style.setProperty("--dur", (2 + Math.random() * 6) + "s");
            particle.style.setProperty("--delay", Math.random() * 5 + "s");
            particlesContainer.appendChild(particle);
        }
    }

    // ==========================================
    // 2. 数字计数动画
    // ==========================================
    function animateCounter(el) {
        const target = parseInt(el.getAttribute("data-target"));
        if (isNaN(target)) return;

        let current = 0;
        const increment = Math.ceil(target / 60);
        const stepTime = Math.floor(1500 / target);

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = current;
            }
        }, stepTime);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll(".stat-num-glitch, .stat-number").forEach((el) => {
        counterObserver.observe(el);
    });

    // ==========================================
    // 3. 阅读进度条
    // ==========================================
    const progressBar = document.getElementById("progress-bar");

    function updateProgressBar() {
        if (!progressBar) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = scrollPercent + "%";
    }

    window.addEventListener("scroll", updateProgressBar, { passive: true });

    // ==========================================
    // 4. 深色/浅色模式切换（含 prefers-color-scheme 自动检测）
    // ==========================================
    const themeToggle = document.getElementById("themeToggle");

    /** 应用主题到 DOM */
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
    }

    /** 获取当前主题 */
    function getCurrentTheme() {
        return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    // 优先级：localStorage > prefers-color-scheme > 默认 dark
    const savedTheme = localStorage.getItem("nobody-lab-theme");
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // 未手动设置过，跟随系统
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        applyTheme(prefersLight ? "light" : "dark");
    }

    // 监听系统主题变化（仅在用户未手动覆盖时生效）
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: light)");
    systemThemeQuery.addEventListener("change", (e) => {
        if (!localStorage.getItem("nobody-lab-theme")) {
            applyTheme(e.matches ? "light" : "dark");
        }
    });

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const current = getCurrentTheme();
            const navItem = themeToggle.closest(".nav-btn-glass");

            // 旋转动画
            if (navItem) {
                navItem.classList.add("rotating");
                setTimeout(() => navItem.classList.remove("rotating"), 400);
            }

            const next = current === "light" ? "dark" : "light";
            applyTheme(next);
            localStorage.setItem("nobody-lab-theme", next);
        });
    }

    // ==========================================
    // 5. 文章筛选
    // ==========================================
    // 5. 文章树状系统 — 引力吸附 + 水珠展开
    const articleTreeContainer = document.getElementById("articlesTree");
    if (articleTreeContainer) {
        const treeTagBtns = articleTreeContainer.querySelectorAll(".tree-tag-btn");
        const treeDroplets = articleTreeContainer.querySelectorAll(".tree-droplet");
        const treeBranches = articleTreeContainer.querySelectorAll(".tree-branch");
        let activeCat = null, dropletState = new Map(), dropletTarget = new Map();
        let mouseX = -9999, mouseY = -9999, rafId = null;
        const TRIGGER = 180;
        treeDroplets.forEach(d => {
            const c = d.getAttribute("data-category");
            dropletState.set(c, { s: 0.3, o: 0 }); dropletTarget.set(c, { s: 0.3, o: 0 });
        });
        function btnCenter(btn) { const r = btn.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }
        function dist(mx, my, btn) { const { cx, cy } = btnCenter(btn); return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2); }
        function updateTree() {
            let bestCat = null, bestD = Infinity;
            treeTagBtns.forEach(btn => { const c = btn.getAttribute("data-category"), d = dist(mouseX, mouseY, btn); if (d < TRIGGER && d < bestD) { bestD = d; bestCat = c; } });
            if (bestCat !== activeCat) { if (activeCat) dropletTarget.set(activeCat, { s: 0.3, o: 0 }); activeCat = bestCat; }
            if (activeCat) { const p = 1 - Math.min(bestD / TRIGGER, 1); dropletTarget.set(activeCat, { s: 0.3 + 0.7 * p, o: Math.min(1, p * 1.5) }); }
            let anim = false;
            treeDroplets.forEach(d => {
                const c = d.getAttribute("data-category"), tgt = dropletTarget.get(c); let st = dropletState.get(c); if (!tgt || !st) return;
                st.s += (tgt.s - st.s) * 0.18; st.o += (tgt.o - st.o) * 0.18;
                if (st.o > 0.01) d.classList.add("active"); else d.classList.remove("active");
                const btn = articleTreeContainer.querySelector('.tree-tag-btn[data-category="' + c + '"]');
                if (btn && st.o > 0.05) { const { cx, cy } = btnCenter(btn); const cr = articleTreeContainer.getBoundingClientRect(); d.style.left = (cx - cr.left) + "px"; d.style.top = (cy - cr.top - 80) + "px"; d.style.transform = "scale(" + st.s + ") translate(-50%, -100%)"; d.style.opacity = st.o; }
                else { d.style.transform = "scale(" + st.s + ")"; d.style.opacity = st.o; }
                if (Math.abs(tgt.s - st.s) > 0.001 || Math.abs(tgt.o - st.o) > 0.001) anim = true;
            });
            treeBranches.forEach(b => { const bc = b.getAttribute("data-branch"), tgtS = bc === activeCat ? 1.06 : 1; const cs = parseFloat((b.style.transform || "").replace(/[^0-9.]/g, "") || "1"); const ns = cs + (tgtS - cs) * 0.12; b.style.transform = "scale(" + ns + ")"; b.style.transformOrigin = "center"; if (Math.abs(tgtS - ns) > 0.0005) anim = true; });
            if (anim) rafId = requestAnimationFrame(updateTree); else rafId = null;
        }
        document.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; if (!rafId) rafId = requestAnimationFrame(updateTree); }, { passive: true });
        document.addEventListener("mouseleave", () => { mouseX = -9999; mouseY = -9999; if (activeCat) dropletTarget.set(activeCat, { s: 0.3, o: 0 }); activeCat = null; if (!rafId) rafId = requestAnimationFrame(updateTree); });
    } /*
    const waterfallCards = document.querySelectorAll(".article-card-waterfall");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const blogCards = document.querySelectorAll(".blog-card");

    function setupFilter(buttons, cards, activeClass) {
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                buttons.forEach((b) => b.classList.remove(activeClass || "active"));
                btn.classList.add(activeClass || "active");

                const filter = btn.getAttribute("data-filter");

                cards.forEach((card) => {
                    if (filter === "all" || card.getAttribute("data-category") === filter) {
                        card.classList.remove("hidden");
                        card.style.animation = "none";
                        card.offsetHeight;
                        card.style.animation = "";
                    } else {
                        card.classList.add("hidden");
                    }
                });
            });
        });
    }




    // ==========================================
*/    // 6. 卡片鼠标光影追踪
    // ==========================================
    document.querySelectorAll(".card-glass-surface").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty("--mouse-x", x + "%");
            card.style.setProperty("--mouse-y", y + "%");
        });
    });

    // ==========================================
    // 7. 首页鼠标视差
    // ==========================================
    const homeMain = document.querySelector(".home-main");

    if (homeMain) {
        homeMain.addEventListener("mousemove", (e) => {
            const rect = homeMain.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            const introBlocks = document.querySelectorAll(".intro-block");
            introBlocks.forEach((block, index) => {
                const factor = (index + 1) * 3;
                block.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });

            const orbs = document.querySelectorAll(".vortex-ring");
            orbs.forEach((orb, i) => {
                const f = (i + 1) * 8;
                orb.style.transform = `translate(${-x * f}px, ${-y * f}px)`;
            });
        });

        homeMain.addEventListener("mouseleave", () => {
            document.querySelectorAll(".intro-block").forEach((block) => {
                block.style.transform = "translate(0, 0)";
            });
            document.querySelectorAll(".vortex-ring").forEach((orb) => {
                orb.style.transform = "";
            });
        });
    }

    // ==========================================
    // 8. 技能节点交互动画
    // ==========================================
    document.querySelectorAll(".skill-node").forEach((node) => {
        node.addEventListener("mouseenter", () => {
            const core = node.querySelector(".node-core");
            if (core) core.style.transform = "scale(1.15)";
        });
        node.addEventListener("mouseleave", () => {
            const core = node.querySelector(".node-core");
            if (core) core.style.transform = "scale(1)";
        });
    });

    // ==========================================
    // 9. UI 版本切换开关
    // ==========================================
    const versionToggle = document.getElementById("versionToggle");
    const versionContainer = document.getElementById("versionSwitchContainer");

    function updateVersionSwitchUI() {
        const currentVersion = localStorage.getItem("nobody-lab-version") || "v3";
        if (versionContainer) {
            if (currentVersion === "v3") {
                versionContainer.classList.add("version-v3-active");
            } else {
                versionContainer.classList.remove("version-v3-active");
            }
        }
    }

    updateVersionSwitchUI();

    if (versionToggle) {
        versionToggle.addEventListener("click", () => {
            const currentVersion = localStorage.getItem("nobody-lab-version") || "v3";
            const nextVersion = currentVersion === "v3" ? "v2" : "v3";
            localStorage.setItem("nobody-lab-version", nextVersion);
            location.reload();
        });
    }

    // ==========================================
    // 10. 键盘快捷键
    // ==========================================
    document.addEventListener("keydown", (e) => {
        if ((e.key === "t" || e.key === "T") && !e.target.matches("input, textarea")) {
            themeToggle?.click();
        }
    });

    // ==========================================
    // 10. 初始化 Morph 菜单系统
    // ==========================================
    initializeMorphMenus();

    // ==========================================
    // 11. 启动宇宙引力吸附引擎（单全局监听 + rAF 空闲暂停）
    // ==========================================
    const planets = [];
    const targetElements = document.querySelectorAll(
        ".btn-glass, .nav-btn-glass, .glass-card, .morph-container"
    );

    targetElements.forEach((el) => {
        planets.push(new MagneticPlanet(el));
    });

    let mouseX = 0;
    let mouseY = 0;
    let rAFId = null;
    let running = false;
    const TICK_INTERVAL = 16; // ~60fps

    /** 单一全局 mousemove 监听 */
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // 批量更新 gravity 计算
        planets.forEach((p) => p.updateGravity(mouseX, mouseY));

        // 如果引擎未运行则启动
        if (!running) {
            running = true;
            if (rAFId) cancelAnimationFrame(rAFId);
            rAFId = requestAnimationFrame(engineTick);
        }
    }, { passive: true });

    /** 渲染循环：空闲时自动暂停 */
    function engineTick() {
        let anyAnimating = false;

        for (const planet of planets) {
            if (planet.render()) anyAnimating = true;
        }

        if (anyAnimating) {
            rAFId = requestAnimationFrame(engineTick);
        } else {
            running = false;
            rAFId = null;
        }
    }

    // ==========================================
    // 12. 项目页面 — 宇宙引力微重力标签吸附系统 v5.0
    //    特征：鼠标邻近检测 → 最近标签弹出 + 微引力Y轴吸附
    //    递归级联动画：最近标签弹至25%时触发相邻标签动画
    // ==========================================
    const projectTagBtns = document.querySelectorAll(".project-tag-btn");
    const circleOverlay = document.getElementById("circleRevealOverlay");
    const contentPanels = document.querySelectorAll(".project-category-panel, .project-default-panel");

    // ═══════════════════════════════════════════
    // ProjectTagGravitySystem — 核心引力引擎
    // ═══════════════════════════════════════════
    class ProjectTagGravitySystem {
        constructor(buttons) {
            this.buttons = Array.from(buttons);
            if (this.buttons.length === 0) return;

            this.states = this.buttons.map((btn, i) => ({
                el: btn,
                index: i,
                popProgress: { current: 0, target: 0, vel: 0 },
                gravityY: { current: 0, target: 0, vel: 0 },
                textOpacity: { current: 0, target: 0, vel: 0 },
                cascadeTriggered: false,
            }));

            this.buttonFullWidths = this.buttons.map((btn) => {
                const clone = btn.cloneNode(true);
                clone.style.position = 'fixed';
                clone.style.visibility = 'hidden';
                clone.style.transform = 'translateX(0)';
                clone.style.transition = 'none';
                clone.style.pointerEvents = 'none';
                clone.style.top = '-9999px';
                clone.style.left = '0px';
                document.body.appendChild(clone);
                const width = clone.getBoundingClientRect().width;
                document.body.removeChild(clone);
                return width;
            });

            this.iconRevealWidth = 28;
            this.triggerRadius = 160;
            this.magneticForce = 0.08;
            this.stiffness = 0.025;
            this.friction = 0.88;
            this.yAttractionForce = 0.03;
            this.yStiffness = 0.03;
            this.yFriction = 0.85;
            this.cascadeExpandThreshold = 0.25;
            this.cascadeRetractThreshold = 0.75;

            this.mouseX = -9999;
            this.mouseY = -9999;
            this.isPageActive = false;

            this._bindEvents();
        }

        _bindEvents() {
            document.addEventListener("mousemove", (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this._updateTargets();
            }, { passive: true });

            document.addEventListener("mouseleave", () => {
                this.mouseX = -9999;
                this.mouseY = -9999;
                this._updateTargets();
            });
        }

        _distToButton(mx, my, btn) {
            const rect = btn.getBoundingClientRect();
            const btnRight = rect.right;
            const btnLeft = btnRight - this.iconRevealWidth;
            const btnTop = rect.top;
            const btnBottom = rect.bottom;
            const btnMidY = (btnTop + btnBottom) / 2;

            const clampedX = Math.max(btnLeft, Math.min(mx, btnRight));
            const clampedY = Math.max(btnTop, Math.min(my, btnBottom));

            const dx = mx - clampedX;
            const dy = my - clampedY;
            const edgeDist = Math.sqrt(dx * dx + dy * dy);

            return {
                edgeDist,
                btnMidY,
                dyCenter: my - btnMidY,
                rect,
            };
        }

        _updateTargets() {
            if (this.buttons.length === 0) return;

            const dists = this.buttons.map((btn, i) =>
                this._distToButton(this.mouseX, this.mouseY, btn)
            );

            let minDist = Infinity;
            for (const info of dists) {
                if (info.edgeDist < minDist) minDist = info.edgeDist;
            }

            if (minDist >= this.triggerRadius) {
                for (let i = 0; i < this.states.length; i++) {
                    this.states[i].popProgress.target = 0;
                    this.states[i].gravityY.target = 0;
                    this.states[i].textOpacity.target = 0;
                    this.states[i].cascadeTriggered = false;
                }
                return;
            }

            for (let i = 0; i < this.states.length; i++) {
                const info = dists[i];
                const state = this.states[i];

                const rawProximity = 1 - Math.min(info.edgeDist / this.triggerRadius, 1);
                const graduatedProximity = Math.pow(rawProximity, 2.2);

                state.popProgress.target = Math.max(0, Math.min(1, graduatedProximity));
                state.cascadeTriggered = graduatedProximity > 0.01;

                const yOffset = info.dyCenter * this.yAttractionForce * rawProximity;
                state.gravityY.target = yOffset;

                state.textOpacity.target = Math.max(0, Math.min(1, rawProximity * 1.8));
            }
        }

        _applyCascade() {
            const n = this.states.length;
            if (n === 0) return;

            const blendedTargets = this.states.map((s) => ({
                pop: s.popProgress.target,
                opacity: s.textOpacity.target,
            }));

            for (let i = 0; i < n; i++) {
                const state = this.states[i];

                let blendedPop = state.popProgress.target;
                let blendedOpacity = state.textOpacity.target;

                if (i > 0) {
                    const neighbor = this.states[i - 1];
                    const neighborVal = Math.max(neighbor.popProgress.current, neighbor.popProgress.target);
                    if (neighborVal > blendedPop) {
                        blendedPop = blendedPop * 0.45 + neighborVal * 0.55;
                        blendedOpacity = blendedOpacity * 0.45 + neighbor.textOpacity.target * 0.55;
                    }
                }

                if (i < n - 1) {
                    const neighbor = this.states[i + 1];
                    const neighborVal = Math.max(neighbor.popProgress.current, neighbor.popProgress.target);
                    if (neighborVal > blendedPop) {
                        blendedPop = blendedPop * 0.45 + neighborVal * 0.55;
                        blendedOpacity = blendedOpacity * 0.45 + neighbor.textOpacity.target * 0.55;
                    }
                }

                blendedTargets[i].pop = Math.max(blendedPop, blendedTargets[i].pop);
                blendedTargets[i].opacity = Math.max(blendedOpacity, blendedTargets[i].opacity);
            }

            for (let i = 0; i < n; i++) {
                this.states[i].popProgress.target = Math.max(0, Math.min(1, blendedTargets[i].pop));
                this.states[i].textOpacity.target = Math.max(0, Math.min(1, blendedTargets[i].opacity));
            }
        }

        render() {
            if (this.buttons.length === 0 || this.states.length === 0) return false;

            let anyAnimating = false;

            for (const state of this.states) {
                const forcePop = (state.popProgress.target - state.popProgress.current) * this.stiffness;
                state.popProgress.vel += forcePop;
                state.popProgress.vel *= this.friction;
                state.popProgress.current += state.popProgress.vel;

                const forceY = (state.gravityY.target - state.gravityY.current) * this.yStiffness;
                state.gravityY.vel += forceY;
                state.gravityY.vel *= this.yFriction;
                state.gravityY.current += state.gravityY.vel;

                const forceOpacity = (state.textOpacity.target - state.textOpacity.current) * (this.stiffness * 2);
                state.textOpacity.vel += forceOpacity;
                state.textOpacity.vel *= (this.friction * 0.9);
                state.textOpacity.current += state.textOpacity.vel;

                if (
                    Math.abs(state.popProgress.vel) > 0.0003 ||
                    Math.abs(state.popProgress.target - state.popProgress.current) > 0.0003 ||
                    Math.abs(state.gravityY.vel) > 0.01 ||
                    Math.abs(state.textOpacity.vel) > 0.0003
                ) {
                    anyAnimating = true;
                }
            }

            this._applyCascade();

            for (const state of this.states) {
                const fullWidth = this.buttonFullWidths[state.index] || 180;
                const hiddenOffset = fullWidth - this.iconRevealWidth;

                const translateX = hiddenOffset * (1 - Math.max(0, Math.min(1, state.popProgress.current)));
                const translateY = state.gravityY.current;
                const textOpacity = Math.max(0, Math.min(1, state.textOpacity.current));
                const textTranslateX = -8 * (1 - textOpacity);

                state.el.style.transform =
                    `translateX(${translateX}px) translateY(${translateY}px)`;

                const textEl = state.el.querySelector(".project-tag-text");
                if (textEl) {
                    textEl.style.opacity = textOpacity;
                    textEl.style.transform = `translateX(${textTranslateX}px)`;
                }
            }

            return anyAnimating;
        }
    }

    // --- 初始化标签引力系统 ---
    let tagGravitySystem = null;
    let tagGravityRAF = null;
    let tagGravityRunning = false;

    if (projectTagBtns.length > 0) {
        tagGravitySystem = new ProjectTagGravitySystem(projectTagBtns);

        function tagGravityTick() {
            if (!tagGravitySystem) return;
            const animating = tagGravitySystem.render();
            if (animating) {
                tagGravityRAF = requestAnimationFrame(tagGravityTick);
            } else {
                tagGravityRunning = false;
                tagGravityRAF = null;
            }
        }

        window.addEventListener("mousemove", () => {
            if (!tagGravityRunning && tagGravitySystem) {
                tagGravityRunning = true;
                if (tagGravityRAF) cancelAnimationFrame(tagGravityRAF);
                tagGravityRAF = requestAnimationFrame(tagGravityTick);
            }
        }, { passive: true });
    }

    // --- 点击切换逻辑（圆形雾化过渡 + 面板柔滑切换） ---
    if (projectTagBtns.length > 0 && circleOverlay && contentPanels.length > 0) {
        let currentActiveTag = null;
        let isRevealing = false;

        function switchPanel(category) {
            contentPanels.forEach((panel) => panel.classList.remove("active"));
            if (category === null) {
                const defaultPanel = document.getElementById("panel-default");
                if (defaultPanel) defaultPanel.classList.add("active");
            } else {
                const targetPanel = document.getElementById("panel-" + category);
                if (targetPanel) targetPanel.classList.add("active");
            }
        }

        function setActiveTag(btn) {
            projectTagBtns.forEach((b) => b.classList.remove("tag-active"));
            if (btn) {
                btn.classList.add("tag-active");
                currentActiveTag = btn;
            } else {
                currentActiveTag = null;
            }
        }

        projectTagBtns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (isRevealing) return;

                const isAlreadyActive = btn.classList.contains("tag-active");

                if (isAlreadyActive) {
                    isRevealing = true;
                    const rect = btn.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;

                    circleOverlay.style.left = cx + "px";
                    circleOverlay.style.top = cy + "px";
                    circleOverlay.classList.remove("collapsing");
                    circleOverlay.classList.add("expanding");

                    setTimeout(() => {
                        switchPanel(null);
                        setActiveTag(null);
                        circleOverlay.classList.remove("expanding");
                        circleOverlay.classList.add("collapsing");

                        setTimeout(() => {
                            circleOverlay.classList.remove("collapsing");
                            circleOverlay.style.left = "0px";
                            circleOverlay.style.top = "0px";
                            isRevealing = false;
                        }, 350);
                    }, 250);
                } else {
                    isRevealing = true;
                    const rect = btn.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;

                    circleOverlay.style.left = cx + "px";
                    circleOverlay.style.top = cy + "px";
                    circleOverlay.classList.remove("collapsing");
                    circleOverlay.classList.add("expanding");

                    setTimeout(() => {
                        switchPanel(btn.getAttribute("data-category"));
                        setActiveTag(btn);
                        circleOverlay.classList.remove("expanding");
                        circleOverlay.classList.add("collapsing");

                        setTimeout(() => {
                            circleOverlay.classList.remove("collapsing");
                            circleOverlay.style.left = "0px";
                            circleOverlay.style.top = "0px";
                            isRevealing = false;
                        }, 350);
                    }, 250);
                }
            });
        });

        const defaultPanel = document.getElementById("panel-default");
        if (defaultPanel) {
            defaultPanel.classList.add("active");
        }
    }

    // ==========================================
    // 13. 控制台欢迎信息（仅开发环境）
    // ==========================================
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        console.log(
            "%c nobody-lab v3.0 ",
            "background: linear-gradient(135deg, #4f46e5, #a855f7, #ec4899); color: white; font-size: 22px; padding: 12px 24px; border-radius: 8px; font-weight: bold;"
        );
        console.log(
            "%c 按钮规范 v1.0 已激活 · 液态引力引擎就绪（单监听 + 空闲暂停）",
            "color: #a855f7; font-size: 14px;"
        );
        console.log(
            "%c ✨ [T] 切换主题  |  按钮规范: .btn-glass / .nav-btn-glass / .glass-card / .morph-container",
            "color: #06b6d4; font-size: 12px;"
        );
    }

});