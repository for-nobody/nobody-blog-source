/* ==============================================
   nobody-lab — 交互逻辑引擎 v4.1
   酸性引力引擎：skew 拉伸视差 + 果冻回弹
   新增：CSS 变量传导 skew → 子元素文字有机跟随
   按钮规范强制绑定：所有 HTML 中的按钮必须遵从此规范
   优化：单全局监听 + rAF 空闲暂停 + prefers-color-scheme
   ============================================== */

// =========================================================================
// 宇宙引力吸附系统 v4.1 (Magnetic Gravity Engine)
// skew 拉伸视差 + 鼠标速度感应 + 果冻回弹
// 新增：通过 CSS 变量将 skew 传导到文字子元素
// =========================================================================

class MagneticPlanet {
    constructor(element, options = {}) {
        this.el = element;
        this.isActive = false;

        const rect = this.el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const isHeavy = area > 20000;

        this.triggerArea = options.triggerArea || (isHeavy ? 45 : 35);
        this.magneticForce = options.magneticForce || (isHeavy ? 0.04 : 0.12);
        this.stiffness = options.stiffness || (isHeavy ? 0.04 : 0.08);
        this.friction = options.friction || (isHeavy ? 0.85 : 0.78);
        this.hoverScale = options.hoverScale || (isHeavy ? 1.005 : 1.015);

        // Translate3d 状态
        this.pos = { x: 0, y: 0 };
        this.vel = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };

        // Scale 状态
        this.scale = { current: 1, target: 1, vel: 0 };

        // ═══ Skew 拉伸视差状态 ═══
        this.skewX = { current: 0, target: 0, vel: 0 };
        this.skewY = { current: 0, target: 0, vel: 0 };

        // 鼠标速度追踪
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseVelX = 0;
        this.mouseVelY = 0;

        // 将 transform 从 CSS 动画接管列表中剔除
        this.el.style.transitionProperty =
            "width, height, border-radius, background, background-color, box-shadow, color, opacity";
    }

    /** 由全局监听调用，传入当前鼠标位置 */
    updateGravity(mouseX, mouseY) {
        // 计算鼠标速度
        this.mouseVelX = mouseX - this.lastMouseX;
        this.mouseVelY = mouseY - this.lastMouseY;
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;

        if (this.el.classList.contains("active")) {
            this.isActive = false;
            this.target.x = 0;
            this.target.y = 0;
            this.scale.target = 1;
            this.skewX.target = 0;
            this.skewY.target = 0;
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

        // 扩展触发范围（含速度感应带）
        const speed = Math.sqrt(this.mouseVelX ** 2 + this.mouseVelY ** 2);
        const extendedTrigger = this.triggerArea + Math.min(speed * 0.8, 30);

        if (distToEdge < extendedTrigger) {
            this.isActive = true;

            this.target.x = dx * this.magneticForce;
            this.target.y = dy * this.magneticForce;
            this.scale.target = distToEdge === 0 ? this.hoverScale : 1;

            // ═══ Skew 拉伸视差 ═══
            const proximity = 1 - Math.min(distToEdge / extendedTrigger, 1);
            const skewIntensity = proximity * 0.15;

            this.skewY.target = this.mouseVelX * skewIntensity * 0.06;
            this.skewX.target = -this.mouseVelY * skewIntensity * 0.06;

            this.skewX.target = Math.max(-2.5, Math.min(2.5, this.skewX.target));
            this.skewY.target = Math.max(-2.5, Math.min(2.5, this.skewY.target));
        } else {
            this.isActive = false;
            this.target.x = 0;
            this.target.y = 0;
            this.scale.target = 1;
            this.skewX.target = 0;
            this.skewY.target = 0;
        }
    }

    render() {
        // --- 位置物理 ---
        const forceX = (this.target.x - this.pos.x) * this.stiffness;
        this.vel.x += forceX;
        this.vel.x *= this.friction;
        this.pos.x += this.vel.x;

        const forceY = (this.target.y - this.pos.y) * this.stiffness;
        this.vel.y += forceY;
        this.vel.y *= this.friction;
        this.pos.y += this.vel.y;

        // --- Scale 物理 ---
        const forceScale = (this.scale.target - this.scale.current) * (this.stiffness * 1.5);
        this.scale.vel += forceScale;
        this.scale.vel *= (this.friction * 0.85);
        this.scale.current += this.scale.vel;

        // --- Skew 物理（果冻回弹）---
        const skewStiffness = this.stiffness * 0.35;
        const skewFriction = this.friction * 0.92;

        const forceSkewX = (this.skewX.target - this.skewX.current) * skewStiffness;
        this.skewX.vel += forceSkewX;
        this.skewX.vel *= skewFriction;
        this.skewX.current += this.skewX.vel;

        const forceSkewY = (this.skewY.target - this.skewY.current) * skewStiffness;
        this.skewY.vel += forceSkewY;
        this.skewY.vel *= skewFriction;
        this.skewY.current += this.skewY.vel;

        // --- 渲染判断 ---
        const isSkewAnimating =
            Math.abs(this.skewX.vel) > 0.0008 ||
            Math.abs(this.skewY.vel) > 0.0008 ||
            Math.abs(this.skewX.target - this.skewX.current) > 0.0008 ||
            Math.abs(this.skewY.target - this.skewY.current) > 0.0008;

        if (this.isActive || this.isAnimating() || isSkewAnimating) {
            this.el.style.transform =
                `translate3d(${this.pos.x}px, ${this.pos.y}px, 0) ` +
                `scale(${this.scale.current}) ` +
                `skew(${this.skewY.current}deg, ${this.skewX.current}deg)`;

            // ═══ v4.2：CSS 变量传导 skew → 文字子元素有机跟随 ═══
            // 子元素取 30% 的 skew，产生约 0.5° 级偏转，形成整体有机感
            const textSkewX = (this.skewX.current * 0.30).toFixed(4);
            const textSkewY = (this.skewY.current * 0.30).toFixed(4);
            this.el.style.setProperty('--skew-x', textSkewX);
            this.el.style.setProperty('--skew-y', textSkewY);
            return true;
        }

        // 动画结束后清除残留
        this.el.style.transform = "";
        this.el.style.removeProperty('--skew-x');
        this.el.style.removeProperty('--skew-y');
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
    // 7. 首页鼠标视差（含 skew 偏移）
    // ==========================================
    const homeMain = document.querySelector(".home-main");

    if (homeMain) {
        let lastParallaxX = 0;
        let lastParallaxY = 0;

        homeMain.addEventListener("mousemove", (e) => {
            const rect = homeMain.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            const velX = x - lastParallaxX;
            const velY = y - lastParallaxY;
            lastParallaxX = x;
            lastParallaxY = y;

            const introBlocks = document.querySelectorAll(".intro-block");
            introBlocks.forEach((block, index) => {
                const factor = (index + 1) * 3;
                const skewAmount = (index + 1) * 0.3;
                block.style.transform =
                    `translate(${x * factor}px, ${y * factor}px) ` +
                    `skew(${velX * skewAmount}deg, ${velY * skewAmount}deg)`;
            });

            const orbs = document.querySelectorAll(".vortex-ring");
            orbs.forEach((orb, i) => {
                const f = (i + 1) * 8;
                orb.style.transform = `translate(${-x * f}px, ${-y * f}px)`;
            });
        });

        homeMain.addEventListener("mouseleave", () => {
            document.querySelectorAll(".intro-block").forEach((block) => {
                block.style.transform = "translate(0, 0) skew(0deg, 0deg)";
            });
            document.querySelectorAll(".vortex-ring").forEach((orb) => {
                orb.style.transform = "";
            });
        });
    }

    // ==========================================
    // 8. 技能节点交互（含 skew）
    // ==========================================
    document.querySelectorAll(".skill-node").forEach((node) => {
        node.addEventListener("mouseenter", () => {
            const core = node.querySelector(".node-core");
            if (core) {
                core.style.transform = "scale(1.15) skew(1deg, -0.5deg)";
            }
        });
        node.addEventListener("mouseleave", () => {
            const core = node.querySelector(".node-core");
            if (core) {
                core.style.transform = "scale(1) skew(0deg, 0deg)";
            }
        });
    });

    // ==========================================
    // 11. 启动宇宙引力吸附引擎 v4.1
    // ==========================================
    const planets = [];
    const targetElements = document.querySelectorAll(
        ".btn-glass:not(.tree-tag-btn, .project-tag-btn), .nav-btn-glass, .glass-card:not(.tree-droplet, .post-content), .card-glass-surface, .stat-card-glass, .text-card"
    );

    targetElements.forEach((el) => {
        planets.push(new MagneticPlanet(el));
    });

    let mouseX = 0;
    let mouseY = 0;
    let rAFId = null;
    let running = false;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        planets.forEach((p) => p.updateGravity(mouseX, mouseY));

        if (!running) {
            running = true;
            if (rAFId) cancelAnimationFrame(rAFId);
            rAFId = requestAnimationFrame(engineTick);
        }
    }, { passive: true });

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
    // 13. 项目页面 — 宇宙引力微重力标签吸附系统 v5.0
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

            // 每个按钮的物理状态
            this.states = this.buttons.map((btn, i) => ({
                el: btn,
                index: i,
                // 弹出进度: 0=隐藏, 1=完全弹出
                popProgress: { current: 0, target: 0, vel: 0 },
                // 微引力Y偏移 (px)
                gravityY: { current: 0, target: 0, vel: 0 },
                // 文字透明度
                textOpacity: { current: 0, target: 0, vel: 0 },
                // 是否已被鼠标激活过（用于递归级联）
                cascadeTriggered: false,
            }));

            // 获取每个按钮的完整宽度（包含 padding、gap、文字）
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

            // 默认半隐藏位移量（只露出图标部分 ≈ 28px）
            this.iconRevealWidth = 28;

            // 引力参数 — 低速平滑弹簧，产生"慢速渐入/渐出"的有机质感
            this.triggerRadius = 160;          // 鼠标邻近检测半径 (px)
            this.magneticForce = 0.08;         // 弹出吸引力
            this.stiffness = 0.025;            // 弹簧刚度（降低→更慢响应）
            this.friction = 0.88;              // 阻尼（提高→减少震荡，更平滑）
            this.yAttractionForce = 0.03;      // Y轴微引力强度
            this.yStiffness = 0.03;            // Y轴刚度（降低→更慢微引力响应）
            this.yFriction = 0.85;             // Y轴阻尼

            // ═══ 递归级联阈值 ═══
            this.cascadeExpandThreshold = 0.25;  // 弹至25%触发递归
            this.cascadeRetractThreshold = 0.75; // 收至75%触发递归

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

        /**
         * 计算鼠标到每个按钮边缘的最小距离
         */
        _distToButton(mx, my, btn) {
            const rect = btn.getBoundingClientRect();
            // 按钮实际占据区域（考虑当前 translateX 偏移）
            const btnRight = rect.right;
            const btnLeft = btnRight - this.iconRevealWidth; // 半隐藏时的实际左边缘
            const btnTop = rect.top;
            const btnBottom = rect.bottom;
            const btnMidY = (btnTop + btnBottom) / 2;

            // 最近点：X方向限制影响区域宽度
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

            // 计算所有按钮的距离和邻近度
            const dists = this.buttons.map((btn, i) =>
                this._distToButton(this.mouseX, this.mouseY, btn)
            );

            // 找出最小距离（用于规范化邻近度）
            let minDist = Infinity;
            for (const info of dists) {
                if (info.edgeDist < minDist) minDist = info.edgeDist;
            }

            // 如果所有按钮都远离鼠标，重置所有目标
            if (minDist >= this.triggerRadius) {
                for (let i = 0; i < this.states.length; i++) {
                    this.states[i].popProgress.target = 0;
                    this.states[i].gravityY.target = 0;
                    this.states[i].textOpacity.target = 0;
                    this.states[i].cascadeTriggered = false;
                }
                return;
            }

            // ═══ 渐进式邻近度：每个按钮根据距离获得比例目标 ═══
            for (let i = 0; i < this.states.length; i++) {
                const info = dists[i];
                const state = this.states[i];

                // 原始邻近度：0=触发边缘, 1=贴着按钮
                const rawProximity = 1 - Math.min(info.edgeDist / this.triggerRadius, 1);

                // 使用幂函数让最近按钮获得更强的弹出权重，远处按钮缓慢衰减
                // proximity^2 使最近的按钮→1.0 弹出，距离翻倍的按钮→0.25 弹出
                const graduatedProximity = Math.pow(rawProximity, 2.2);

                // 弹出目标：渐进式，距离越近弹出越多
                state.popProgress.target = Math.max(0, Math.min(1, graduatedProximity));
                state.cascadeTriggered = graduatedProximity > 0.01;

                // 微引力Y偏移（与邻近度相关）
                const yOffset = info.dyCenter * this.yAttractionForce * rawProximity;
                state.gravityY.target = yOffset;

                // 文字透明度：仅在明显靠近时显示
                state.textOpacity.target = Math.max(0, Math.min(1, rawProximity * 1.8));
            }
        }

        /**
         * 递归级联：基于渐进式邻近度，相邻按钮借用邻居的弹出进度做融合
         * 让动画更加有机——相邻按钮之间平滑过渡，无硬阈值切换
         */
        _applyCascade() {
            const n = this.states.length;
            if (n === 0) return;

            // ═══ 双向平滑融合：每个按钮的目标值与其直接邻居做加权混合 ═══
            // 这代替了之前的硬阈值级联，产生有机的"波动传导"效果
            const blendedTargets = this.states.map((s) => ({
                pop: s.popProgress.target,
                opacity: s.textOpacity.target,
            }));

            for (let i = 0; i < n; i++) {
                const state = this.states[i];

                // 当前按钮自身的 target
                let blendedPop = state.popProgress.target;
                let blendedOpacity = state.textOpacity.target;

                // 融合上方邻居（如果存在且有更高 target）
                if (i > 0) {
                    const neighbor = this.states[i - 1];
                    // 用邻居的 current 值做融合（比 target 更平滑）
                    const neighborVal = Math.max(neighbor.popProgress.current, neighbor.popProgress.target);
                    if (neighborVal > blendedPop) {
                        // 邻居值以 0.55 权重渗入
                        blendedPop = blendedPop * 0.45 + neighborVal * 0.55;
                        blendedOpacity = blendedOpacity * 0.45 + neighbor.textOpacity.target * 0.55;
                    }
                }

                // 融合下方邻居
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

            // 应用融合后的目标值
            for (let i = 0; i < n; i++) {
                this.states[i].popProgress.target = Math.max(0, Math.min(1, blendedTargets[i].pop));
                this.states[i].textOpacity.target = Math.max(0, Math.min(1, blendedTargets[i].opacity));
            }
        }

        /** 每帧调用 */
        render() {
            if (this.buttons.length === 0 || this.states.length === 0) return false;

            let anyAnimating = false;

            // 更新物理状态
            for (const state of this.states) {
                // --- 弹出进度物理 ---
                const forcePop = (state.popProgress.target - state.popProgress.current) * this.stiffness;
                state.popProgress.vel += forcePop;
                state.popProgress.vel *= this.friction;
                state.popProgress.current += state.popProgress.vel;

                // --- 微引力Y物理 ---
                const forceY = (state.gravityY.target - state.gravityY.current) * this.yStiffness;
                state.gravityY.vel += forceY;
                state.gravityY.vel *= this.yFriction;
                state.gravityY.current += state.gravityY.vel;

                // --- 文字透明度物理 ---
                const forceOpacity = (state.textOpacity.target - state.textOpacity.current) * (this.stiffness * 2);
                state.textOpacity.vel += forceOpacity;
                state.textOpacity.vel *= (this.friction * 0.9);
                state.textOpacity.current += state.textOpacity.vel;

                // 检查是否在动画中
                if (
                    Math.abs(state.popProgress.vel) > 0.0003 ||
                    Math.abs(state.popProgress.target - state.popProgress.current) > 0.0003 ||
                    Math.abs(state.gravityY.vel) > 0.01 ||
                    Math.abs(state.textOpacity.vel) > 0.0003
                ) {
                    anyAnimating = true;
                }
            }

            // 递归级联传播（基于 current 值）
            this._applyCascade();

            // 应用 transform 和样式
            for (const state of this.states) {
                const fullWidth = this.buttonFullWidths[state.index] || 180;
                const hiddenOffset = fullWidth - this.iconRevealWidth;

                // 弹出位移: popProgress=0 → translateX(hiddenOffset), popProgress=1 → translateX(0)
                const translateX = hiddenOffset * (1 - Math.max(0, Math.min(1, state.popProgress.current)));

                // 微引力Y偏移
                const translateY = state.gravityY.current;

                // 文字透明度
                const textOpacity = Math.max(0, Math.min(1, state.textOpacity.current));
                const textTranslateX = -8 * (1 - textOpacity);

                state.el.style.transform =
                    `translateX(${translateX}px) translateY(${translateY}px)`;

                // 文字子元素
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

        // 将 tag 引力系统挂载到全局 mousemove 上（复用已有监听或独立监听）
        // 独立监听以隔离逻辑
        window.addEventListener("mousemove", () => {
            if (!tagGravityRunning && tagGravitySystem) {
                tagGravityRunning = true;
                if (tagGravityRAF) cancelAnimationFrame(tagGravityRAF);
                tagGravityRAF = requestAnimationFrame(tagGravityTick);
            }
        }, { passive: true });
    }
})();
