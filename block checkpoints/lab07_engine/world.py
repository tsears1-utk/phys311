import numpy as np

class World:
    def __init__(self, integrator, bounds=None, restitution=0.9):
        if bounds is not None:
            xmin, xmax, ymin, ymax = map(float, bounds)
            self.bounds = (xmin, xmax, ymin, ymax)
        else:
            self.bounds = None

        self.bodies = []
        self.forces = []
        self.integrator = integrator
        self.restitution = float(restitution)
        self.time = 0.0
        self.history = {
            "time": [],
            "positions": [],
            "velocities": [],
            "kinetic_energy": [],
            "potential_energy": [],
            "total_energy": [],
            "momentum": [],
        }

    def add_body(self, body):
        self.bodies.append(body)

    def add_force(self, force):
        self.forces.append(force)

    def kinetic_energy(self):
        return sum(0.5 * body.m * np.dot(body.v, body.v) for body in self.bodies)

    def potential_energy(self):
        return sum(force.potential_energy(self) for force in self.forces)

    def total_energy(self):
        return self.kinetic_energy() + self.potential_energy()

    def momentum(self):
        total = np.zeros(2, dtype=float)
        for body in self.bodies:
            total += body.m * body.v
        return total

    def record_state(self):
        self.history["time"].append(self.time)
        self.history["positions"].append(np.array([b.r.copy() for b in self.bodies]))
        self.history["velocities"].append(np.array([b.v.copy() for b in self.bodies]))
        self.history["kinetic_energy"].append(self.kinetic_energy())
        self.history["potential_energy"].append(self.potential_energy())
        self.history["total_energy"].append(self.total_energy())
        self.history["momentum"].append(self.momentum())

    def clear_history(self):
        for values in self.history.values():
            values.clear()

    def step(self, dt):
        if not self.history["time"]:
            self.record_state()  # preserve the initial condition

        for body in self.bodies:
            body.clear_accumulators()
        for force in self.forces:
            force.apply(self)

        self.integrator.step(self, dt)
        self.handle_collisions()
        self.time += dt
        self.record_state()

    def run(self, duration, dt):
        if not self.history["time"]:
            self.record_state()
        steps = int(round(duration / dt))
        for _ in range(steps):
            self.step(dt)
        return self.history

    def handle_collisions(self):
        if self.bounds is not None:
            for body in self.bodies:
                self._resolve_wall_collisions(body)

        # Check each pair
        for i in range(len(self.bodies)):
            for j in range(i + 1, len(self.bodies)):
                self._resolve_body_collision(self.bodies[i], self.bodies[j])

    def _resolve_wall_collisions(self, body):
        xmin, xmax, ymin, ymax = self.bounds
        e = self.restitution
        r = body.radius

        if body.r[0] - r < xmin:
            body.r[0] = xmin + r
            if body.v[0] < 0:
                body.v[0] = -e * body.v[0]
        if body.r[0] + r > xmax:
            body.r[0] = xmax - r
            if body.v[0] > 0:
                body.v[0] = -e * body.v[0]
        if body.r[1] - r < ymin:
            body.r[1] = ymin + r
            if body.v[1] < 0:
                body.v[1] = -e * body.v[1]
        if body.r[1] + r > ymax:
            body.r[1] = ymax - r
            if body.v[1] > 0:
                body.v[1] = -e * body.v[1]

    def _resolve_body_collision(self, body_a, body_b):
        displacement = body_b.r - body_a.r
        distance = np.linalg.norm(displacement)
        min_distance = body_a.radius + body_b.radius
        if distance >= min_distance:
            return

        if distance > 1e-12:
            normal = displacement / distance  # points from A toward B
        else:
            normal = np.array([1.0, 0.0])

        inv_ma = 1.0 / body_a.m
        inv_mb = 1.0 / body_b.m
        inv_sum = inv_ma + inv_mb

        # First remove overlap so the same pair does not remain interpenetrating.
        overlap = min_distance - distance
        body_a.r -= normal * overlap * inv_ma / inv_sum
        body_b.r += normal * overlap * inv_mb / inv_sum

        # Impulse acts only if the bodies are moving toward one another.
        relative_velocity = body_b.v - body_a.v
        speed_along_normal = np.dot(relative_velocity, normal)
        if speed_along_normal < 0.0:
            impulse_magnitude = -(1.0 + self.restitution) * speed_along_normal / inv_sum
            impulse = impulse_magnitude * normal
            body_a.v -= impulse * inv_ma
            body_b.v += impulse * inv_mb