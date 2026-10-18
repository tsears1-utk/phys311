BLOCK 2 CHECKPOINT - FOUR-BALL ENGINE DEMO

OVERVIEW

This project extends my Lab 7 Part C to a four-body scene. Four circular balls move and collide inside a rectangular box under gravity and drag. The simulation uses the Lab 7 physics engine and the Euler-Cromer integrator. The coefficient of restitution is 0.88, so ball-to-ball and wall impacts are partially inelastic.

ENGINE ARCHITECTURE

The file lab07_engine/body.py defines the Body class. Each Body stores a ball's mass, position, velocity, radius, and accumulated force.
The file lab07_engine/forces.py defines Gravity and Drag. These forces add their contributions to each body's force accumulator.
The file lab07_engine/integrators.py defines EulerCromer, which updates velocity and then position using a fixed timestep.
The file lab07_engine/world.py defines World. It manages the bodies, forces, integrator, simulation history, wall collisions, and collisions between pairs of balls.

HOW TO RUN

From the project root folder launch the notebook with the lab07_engine folder in the same folder as block_02.ipynb.

VALIDATION AND PHYSICS

The scene contains four interacting bodies and registers two forces: gravity and quadratic drag. The notebook checks the minimum separation for each ball pair to identify contact, and plots the trajectories, kinetic energy, gravitational potential energy, total mechanical energy, and total momentum.

Total mechanical energy decreases overall because drag dissipates energy and collisions are partially inelastic. Fixed-timestep numerical error can also affect the measured energy. Total momentum is not expected to remain constant for the full scene because gravity and drag are external forces on the balls, and the box walls exert impulses during impacts.

A separate elastic-collision test uses two equal-mass balls with no forces and no walls, and a coefficient of restitution of 1.0. The notebook checks that linear momentum and kinetic energy are conserved during this isolated collision.
