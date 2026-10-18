import numpy as np


class Force:
    def apply(self, world):
        raise NotImplementedError("Each force must implement apply(world)")

    def potential_energy(self, world):
        return 0.0


class Gravity(Force):
    def __init__(self, g=9.81):
        self.g = np.array([0.0, -float(g)])

    def apply(self, world):
        for body in world.bodies:
            body.force += body.m * self.g

    def potential_energy(self, world):
        return sum(-body.m * np.dot(self.g, body.r) for body in world.bodies)


class Drag(Force):
    def __init__(self, c):
        self.c = float(c)

    def apply(self, world):
        for body in world.bodies:
            speed = np.linalg.norm(body.v)
            body.force += -self.c * speed * body.v

class Spring(Force):
    def __init__(self, body, k, anchor=(0.0, 0.0)):
        self.body = body
        self.k = float(k)
        self.anchor = np.asarray(anchor, dtype=float)

    def apply(self, world):
        displacement = self.body.r - self.anchor
        self.body.force += -self.k * displacement

    def potential_energy(self, world):
        displacement = self.body.r - self.anchor
        return 0.5 * self.k * np.dot(displacement, displacement)
