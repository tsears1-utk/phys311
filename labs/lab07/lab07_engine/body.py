import numpy as np

class Body:
    def __init__(self, mass, pos, vel, radius=0.1, I=None, name=None):
        self.m = float(mass)
        self.r = np.asarray(pos, dtype=float).copy()
        self.v = np.asarray(vel, dtype=float).copy()
        if self.r.shape != (2,) or self.v.shape != (2,):
            raise ValueError("pos and vel must each be 2D vectors")

        self.radius = float(radius)
        self.name = name or "body"
        self.theta = 0.0
        self.omega = 0.0
        self.I = float(I) if I is not None else 0.5 * self.m * self.radius**2
        self.force = np.zeros(2, dtype=float)
        self.torque = 0.0

    def clear_accumulators(self):
        # Reset force and torque before the forces are applied for a step
        self.force[:] = 0.0
        self.torque = 0.0
