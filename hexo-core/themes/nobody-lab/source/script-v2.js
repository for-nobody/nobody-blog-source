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

(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 卡片鼠标光影追踪
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
    // 11. 启动宇宙引力吸附引擎（单全局监听 + rAF 空闲暂停）
    // ==========================================
    const planets = [];
    const targetElements = document.querySelectorAll(
        ".btn-glass:not(.tree-tag-btn, .project-tag-btn), .nav-btn-glass, .glass-card:not(.tree-droplet, .post-content)"
    );

    targetElements.forEach((el) => {
        planets.push(new MagneticPlanet(el));
    });

    let mouseX = 0;
    let mouseY = 0;
    let rAFId = null;
    let running = false;

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

    if (projectTagBtns.length > 0 && window.matchMedia("(min-width: 1025px)").matches) {
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
})();
