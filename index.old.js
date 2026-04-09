import { Rule, Constant, LSystem2D } from "./lsystem.js";
import { Vec2 } from "./vec.js";

const angle = 25 * Math.PI / 180;
const step = 6;
const iterations = 5;

const rules = [
    new Rule("X", "F+[[X]-X]-F[-FX]+X"),
    new Rule("F", "FF")
];

const constants = [

    new Constant("F", (state) => {
        const newPos = state.pos.add(state.dir.scale(step));
        state.segments.push({ start: state.pos.clone(), end: newPos.clone(), jump: false });
        state.pos = newPos;
    }),

    new Constant("+", (state) => {
        state.dir = state.dir.rotate(-angle);
    }),

    new Constant("-", (state) => {
        state.dir = state.dir.rotate(angle);
    }),

    new Constant("[", (state) => {
        state.stack.push({ pos: state.pos.clone(), dir: state.dir.clone() });
    }),

    new Constant("]", (state) => {
        const popped = state.stack.pop();
        state.pos = popped.pos;
        state.dir = popped.dir;
        state.segments.push({ start: state.pos.clone(), end: state.pos.clone(), jump: true });
    })
];

const axiom = "-X";
const canvas = document.querySelector("canvas");

const initialState = {
    pos: new Vec2(canvas.width / 2, canvas.height),
    dir: new Vec2(0, -1)
};

const system = new LSystem2D(rules, axiom, constants);
const lstring = system.compute(iterations);
const segments = system.draw(lstring, initialState);

// Render
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.beginPath();
ctx.moveTo(initialState.pos.x, initialState.pos.y);

for (const seg of segments) {
    if (seg.jump) {
        ctx.moveTo(seg.start.x, seg.start.y);
    } else {
        ctx.lineTo(seg.end.x, seg.end.y);
    }
}

ctx.stroke();