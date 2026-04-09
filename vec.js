export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vec2(0, 0);
        return new Vec2(this.x / mag, this.y / mag);
    }

    add(other) { return new Vec2(this.x + other.x, this.y + other.y); }
    scale(s) { return new Vec2(this.x * s, this.y * s); }
    clone() { return new Vec2(this.x, this.y); }
}

export class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Rodrigues' rotation formula: rotate this vector around `axis` by `angle` radians
    rotate(axis, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const k = axis.normalize();

        const dot = k.x * this.x + k.y * this.y + k.z * this.z;

        // cross product k × this
        const cx = k.y * this.z - k.z * this.y;
        const cy = k.z * this.x - k.x * this.z;
        const cz = k.x * this.y - k.y * this.x;

        return new Vec3(
            this.x * cos + cx * sin + k.x * dot * (1 - cos),
            this.y * cos + cy * sin + k.y * dot * (1 - cos),
            this.z * cos + cz * sin + k.z * dot * (1 - cos)
        );
    }

    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vec3(0, 0, 0);
        return new Vec3(this.x / mag, this.y / mag, this.z / mag);
    }

    add(other) { return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z); }
    scale(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }

    clone() { return new Vec3(this.x, this.y, this.z); }
}