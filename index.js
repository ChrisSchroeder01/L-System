import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Rule, Constant, LSystem3D } from "./lsystem.js";
import { Vec3 } from "./vec.js";

// CONFIG

const STEP = 1.5;
const ANGLE = 25 * Math.PI / 180;

// INITIAL RULE DATA

let ruleData = [
    { symbol: "X", production: "F[+X][-YX][^][&ZY]X" },
    { symbol: "Y", production: "F[+Z][-Z]^Z&F/" },
    { symbol: "Z", production: "F[Z+]\\" },
    { symbol: "F", production: "FY" }
];

// CONSTANTS

function makeConstants() {
    return [
        new Constant("F", (state) => {
            const newPos = state.pos.add(state.forward.scale(STEP));
            state.segments.push({ start: state.pos.clone(), end: newPos.clone() });
            state.pos = newPos;
        }),
        new Constant("+", (state) => {
            state.forward = state.forward.rotate(state.up, ANGLE);
            state.left = state.left.rotate(state.up, ANGLE);
        }),
        new Constant("-", (state) => {
            state.forward = state.forward.rotate(state.up, -ANGLE);
            state.left = state.left.rotate(state.up, -ANGLE);
        }),
        new Constant("^", (state) => {
            state.forward = state.forward.rotate(state.left, ANGLE);
            state.up = state.up.rotate(state.left, ANGLE);
        }),
        new Constant("&", (state) => {
            state.forward = state.forward.rotate(state.left, -ANGLE);
            state.up = state.up.rotate(state.left, -ANGLE);
        }),
        new Constant("/", (state) => {
            state.left = state.left.rotate(state.forward, ANGLE);
            state.up = state.up.rotate(state.forward, ANGLE);
        }),
        new Constant("\\", (state) => {
            state.left = state.left.rotate(state.forward, -ANGLE);
            state.up = state.up.rotate(state.forward, -ANGLE);
        }),
        new Constant("[", (state) => {
            state.stack.push({
                pos: state.pos.clone(),
                forward: state.forward.clone(),
                up: state.up.clone(),
                left: state.left.clone()
            });
        }),
        new Constant("]", (state) => {
            const s = state.stack.pop();
            state.pos = s.pos;
            state.forward = s.forward;
            state.up = s.up;
            state.left = s.left;
        })
    ];
}

// THREE.JS SCENE

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 40, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 20, 0);
controls.update();

// Sky
const skyGeo = new THREE.SphereGeometry(1000, 32, 16);
const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xcccccc) }
    },
    vertexShader: `
        varying vec3 vWorldPos;
        void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
            float t = normalize(vWorldPos).y * 0.5 + 0.5;
            gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
    `
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// Line object
const lineMat = new THREE.LineBasicMaterial({ color: 0x2d6a1f });
const lineObj = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat);
scene.add(lineObj);

// REBUILD FUNCTION

function rebuild() {
    const statusEl = document.getElementById("status");
    const axiom = document.getElementById("axiom-input").value.trim();
    const iters = Math.max(1, Math.min(10, parseInt(document.getElementById("iters-input").value) || 6));

    // Collect rules from DOM
    const rows = document.querySelectorAll(".rule-row");
    const rules = [];
    for (const row of rows) {
        const sym = row.querySelector(".rule-symbol").value.trim();
        const prod = row.querySelector(".rule-production").value.trim();
        if (sym && prod) rules.push(new Rule(sym, prod));
    }

    if (!axiom) { statusEl.textContent = "Axiom is empty."; return; }
    if (!rules.length) { statusEl.textContent = "No rules defined."; return; }

    try {
        statusEl.textContent = "Computing…";
        const system = new LSystem3D(rules, axiom, makeConstants());
        const lstring = system.compute(iters);

        const initialState = {
            pos: new Vec3(0, 0, 0),
            forward: new Vec3(0, 1, 0),
            up: new Vec3(0, 0, -1),
            left: new Vec3(-1, 0, 0)
        };

        const segments = system.draw(lstring, initialState);
        const positions = [];
        for (const seg of segments) {
            positions.push(seg.start.x, seg.start.y, seg.start.z);
            positions.push(seg.end.x, seg.end.y, seg.end.z);
        }

        // Replace geometry without touching camera / controls
        lineObj.geometry.dispose();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        lineObj.geometry = geo;

        statusEl.textContent = `${segments.length.toLocaleString()} segments`;
    } catch (err) {
        statusEl.textContent = "Error: " + err.message;
        console.error(err);
    }
}

// OVERLAY UI LOGIC

function createRuleRow(symbol = "", production = "") {
    const container = document.getElementById("rules-container");

    const row = document.createElement("div");
    row.className = "rule-row input-group input-group-sm mb-1";

    row.innerHTML = `
        <span class="input-group-text" style="width:2.5rem; justify-content:center;">→</span>
        <input type="text" class="rule-symbol form-control" style="max-width:3rem"
               placeholder="A" value="${symbol}" maxlength="1">
        <input type="text" class="rule-production form-control"
               placeholder="production" value="${production}">
        <button class="btn btn-outline-danger btn-remove" type="button">✕</button>
    `;

    row.querySelector(".btn-remove").addEventListener("click", () => {
        row.remove();
        rebuild();
    });

    row.querySelector(".rule-symbol").addEventListener("input", debounce(rebuild, 400));
    row.querySelector(".rule-production").addEventListener("input", debounce(rebuild, 400));

    container.appendChild(row);
}

function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Populate initial rules
for (const r of ruleData) createRuleRow(r.symbol, r.production);

document.getElementById("btn-add-rule").addEventListener("click", () => {
    createRuleRow();
});

document.getElementById("axiom-input").addEventListener("input", debounce(rebuild, 400));
document.getElementById("iters-input").addEventListener("change", () => rebuild());

// Initial build
rebuild();

// RENDER LOOP

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

(function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
})();