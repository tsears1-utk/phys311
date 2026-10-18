class EulerCromer:
    def step(self, world, dt):
        for body in world.bodies:
            acceleration = body.force / body.m
            body.v += acceleration * dt
            body.r += body.v * dt

            angular_acceleration = body.torque / body.I
            body.omega += angular_acceleration * dt
            body.theta += body.omega * dt