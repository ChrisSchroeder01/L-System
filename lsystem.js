import { Vec2 } from "./vec.js";

export class Rule {
    constructor(input, output) {
        this.input = input;
        this.output = output;
    }
}

export class Constant {
    constructor(char, callback) {
        this.char = char;
        this.callback = callback;
    }
}

export class LSystem2D {
    constructor(rules, axiom, constants) {
        this.rules = rules;
        this.axiom = axiom;

        this.ruleMap = new Map();
        for (let r of rules) this.ruleMap.set(r.input, r.output);

        this.constantMap = new Map();
        for (let c of constants) this.constantMap.set(c.char, c);
    }

    compute(n) {
        let current = this.axiom;
        for (let i = 0; i < n; i++) {
            let next = "";
            for (let char of current) {
                next += this.ruleMap.get(char) ?? char;
            }
            current = next;
        }
        return current;
    }

    // Returns an array of { start: Vec2, end: Vec2, jump: bool } segments.
    // jump = true means the pen lifted (after a ] pop), so index.js does moveTo instead of lineTo.
    draw(lstring, initialState) {
        const segments = [];

        const state = {
            pos: initialState.pos.clone(),
            dir: initialState.dir.clone(),
            segments,
            stack: []
        };

        for (let char of lstring) {
            this.constantMap.get(char)?.callback(state);
        }

        return segments;
    }
}

export class LSystem3D {
    constructor(rules, axiom, constants) {
        this.rules = rules;
        this.axiom = axiom;

        this.ruleMap = new Map();
        for (let r of rules) this.ruleMap.set(r.input, r.output);

        this.constantMap = new Map();
        for (let c of constants) this.constantMap.set(c.char, c);
    }

    compute(n) {
        let current = this.axiom;
        for (let i = 0; i < n; i++) {
            let next = "";
            for (let char of current) {
                next += this.ruleMap.get(char) ?? char;
            }
            current = next;
        }
        return current;
    }

    // Returns an array of { start: Vec3, end: Vec3 } segments.
    // index3d.js is responsible for turning these into Three.js geometry.
    draw(lstring, initialState) {
        const segments = [];

        const state = {
            pos: initialState.pos.clone(),
            forward: initialState.forward.clone(), // H (heading)
            up: initialState.up.clone(),           // U
            left: initialState.left.clone(),        // L
            segments,
            stack: []
        };

        for (let char of lstring) {
            this.constantMap.get(char)?.callback(state);
        }

        return segments;
    }
}