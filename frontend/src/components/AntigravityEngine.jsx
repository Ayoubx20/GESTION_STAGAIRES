import React, { useEffect, useRef } from 'react';
import { useAntigravity } from '../contexts/AntigravityContext';

const AntigravityEngine = () => {
  const { isAntigravityActive, setIsAntigravityActive } = useAntigravity();
  const bodiesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const grabbedBodyRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0 });
  const tiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isAntigravityActive) {
      startPhysics();
    } else {
      stopAndRestorePhysics();
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isAntigravityActive]);

  const startPhysics = () => {
    // 1. Query target elements in the page
    const selector = '.card, .stat-card, .table-container, h1, h2, h3, aside, nav, canvas, button:not([class*="antigravity"]), input, select, textarea, .recharts-wrapper';
    const rawElements = Array.from(document.querySelectorAll(selector));
    
    // Filter out invisible, tiny or overlay elements
    const visibleElements = rawElements.filter(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return false;
      
      // Exclude antigravity buttons/controls
      if (el.closest('.antigravity-toggle')) return false;
      
      return true;
    });

    // 2. Initialize physics bodies
    const newBodies = visibleElements.map(el => {
      const rect = el.getBoundingClientRect();
      
      // Backup original styles
      const originalStyles = {
        position: el.style.position,
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
        margin: el.style.margin,
        zIndex: el.style.zIndex,
        transform: el.style.transform,
        transition: el.style.transition,
        pointerEvents: el.style.pointerEvents,
        boxShadow: el.style.boxShadow,
      };

      const x = rect.left;
      const y = rect.top;

      // Assign initial minor horizontal kick and random hop
      return {
        domElement: el,
        originalStyles,
        originalLeft: x,
        originalTop: y,
        x,
        y,
        width: rect.width,
        height: rect.height,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 4 - 3, // upward pop
        angle: 0,
        vAngle: (Math.random() - 0.5) * 0.05,
        mass: Math.max(1, (rect.width * rect.height) / 10000),
        isGrabbed: false,
      };
    });

    bodiesRef.current = newBodies;

    // 3. Make them absolute/fixed in place visually
    newBodies.forEach(body => {
      const el = body.domElement;
      el.style.position = 'fixed';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = `${body.width}px`;
      el.style.height = `${body.height}px`;
      el.style.margin = '0';
      el.style.zIndex = '9999';
      el.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
      el.style.transition = 'none';
      el.style.pointerEvents = 'auto'; // ensure draggable
      el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(0rad)`;
    });

    // 4. Bind events
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    // 5. Start main loop
    animationFrameRef.current = requestAnimationFrame(updatePhysicsLoop);
  };

  const stopAndRestorePhysics = () => {
    // Cancel loop
    cancelAnimationFrame(animationFrameRef.current);

    // Unbind events
    window.removeEventListener('mousedown', handlePointerDown);
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUp);
    window.removeEventListener('touchstart', handlePointerDown);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
    window.removeEventListener('deviceorientation', handleDeviceOrientation);

    // Restore positions
    const bodies = bodiesRef.current;
    if (bodies.length === 0) return;

    bodies.forEach(body => {
      const el = body.domElement;
      if (!el) return;

      // Animate back to original flow coords
      el.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), width 0.8s, height 0.8s';
      el.style.transform = `translate3d(${body.originalLeft}px, ${body.originalTop}px, 0) rotate(0rad)`;
    });

    // Wait for transition, then reset clean original styles
    setTimeout(() => {
      bodies.forEach(body => {
        const el = body.domElement;
        if (!el) return;
        
        // Restore all clean stylesheet/inline states
        const styles = body.originalStyles;
        el.style.position = styles.position;
        el.style.left = styles.left;
        el.style.top = styles.top;
        el.style.width = styles.width;
        el.style.height = styles.height;
        el.style.margin = styles.margin;
        el.style.zIndex = styles.zIndex;
        el.style.transform = styles.transform;
        el.style.transition = styles.transition;
        el.style.pointerEvents = styles.pointerEvents;
        el.style.boxShadow = styles.boxShadow;
      });
      bodiesRef.current = [];
    }, 850);
  };

  const handleDeviceOrientation = (e) => {
    // Gamma is left-right tilt [-90, 90], Beta is front-back tilt [-180, 180]
    if (e.gamma !== null && e.beta !== null) {
      // Normalize values
      tiltRef.current.x = e.gamma / 45; // limit tilt speed scale
      tiltRef.current.y = e.beta / 45;
    }
  };

  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    mouseRef.current.x = clientX;
    mouseRef.current.y = clientY;
    mouseRef.current.prevX = clientX;
    mouseRef.current.prevY = clientY;
    mouseRef.current.vx = 0;
    mouseRef.current.vy = 0;

    // Find if clicked element is a body or inside a body
    const target = e.target;
    const clickedBody = bodiesRef.current.find(body => 
      body.domElement === target || body.domElement.contains(target)
    );

    if (clickedBody) {
      grabbedBodyRef.current = clickedBody;
      clickedBody.isGrabbed = true;
      clickedBody.vx = 0;
      clickedBody.vy = 0;
      clickedBody.vAngle = 0;
      
      dragOffsetRef.current = {
        x: clientX - clickedBody.x,
        y: clientY - clickedBody.y
      };

      // Prevent scrolling on touch screens
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    mouseRef.current.x = clientX;
    mouseRef.current.y = clientY;
  };

  const handlePointerUp = () => {
    if (grabbedBodyRef.current) {
      grabbedBodyRef.current.isGrabbed = false;
      // Toss inertia
      grabbedBodyRef.current.vx = mouseRef.current.vx * 0.8;
      grabbedBodyRef.current.vy = mouseRef.current.vy * 0.8;
      grabbedBodyRef.current.vAngle = (mouseRef.current.vx) * 0.01;
      grabbedBodyRef.current = null;
    }
  };

  const updatePhysicsLoop = () => {
    const gravityY = 0.5 + (tiltRef.current.y * 0.5); // Add accelerometer
    const gravityX = tiltRef.current.x * 0.5;
    const restitution = 0.55; // bounce coefficient
    const friction = 0.985;
    const borderFriction = 0.85;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const bodies = bodiesRef.current;

    // Update mouse velocity in loop for smoothness
    const mouse = mouseRef.current;
    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    // 1. Solve single body physics
    bodies.forEach(body => {
      if (body.isGrabbed) {
        // Drag body
        const targetX = mouse.x - dragOffsetRef.current.x;
        const targetY = mouse.y - dragOffsetRef.current.y;
        
        body.vx = targetX - body.x;
        body.vy = targetY - body.y;
        body.x = targetX;
        body.y = targetY;
        body.angle += body.vx * 0.005;
        body.vAngle = body.vx * 0.01;
      } else {
        // Normal gravity & forces
        body.vx += gravityX;
        body.vy += gravityY;
        
        // Air resistance damping
        body.vx *= friction;
        body.vy *= friction;
        body.vAngle *= 0.95;

        // Position changes
        body.x += body.vx;
        body.y += body.vy;
        body.angle += body.vAngle;

        // BOUNDS CHECKING
        // Floor
        if (body.y + body.height > screenHeight) {
          body.y = screenHeight - body.height;
          body.vy = -body.vy * restitution;
          body.vx *= borderFriction;
          body.vAngle = -body.vx * 0.02; // roll effect
        }
        // Ceiling
        if (body.y < 0) {
          body.y = 0;
          body.vy = -body.vy * restitution;
          body.vx *= borderFriction;
        }
        // Left wall
        if (body.x < 0) {
          body.x = 0;
          body.vx = -body.vx * restitution;
          body.vAngle = body.vy * 0.02;
        }
        // Right wall
        if (body.x + body.width > screenWidth) {
          body.x = screenWidth - body.width;
          body.vx = -body.vx * restitution;
          body.vAngle = -body.vy * 0.02;
        }
      }
    });

    // 2. Resolve simple block-on-block collisions (AABB stacked columns)
    // To make stacking clean and prevent performance chokes, we do it in a lightweight single-pass
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const A = bodies[i];
        const B = bodies[j];

        // AABB intersection check
        const overlapX = Math.min(A.x + A.width, B.x + B.width) - Math.max(A.x, B.x);
        const overlapY = Math.min(A.y + A.height, B.y + B.height) - Math.max(A.y, B.y);

        if (overlapX > 5 && overlapY > 5) {
          // Push apart along axis of least penetration
          if (overlapX < overlapY) {
            const push = overlapX / 2;
            if (A.x + A.width / 2 < B.x + B.width / 2) {
              if (!A.isGrabbed) A.x -= push;
              if (!B.isGrabbed) B.x += push;
              const temp = A.vx;
              A.vx = B.vx * 0.5;
              B.vx = temp * 0.5;
            } else {
              if (!A.isGrabbed) A.x += push;
              if (!B.isGrabbed) B.x -= push;
              const temp = A.vx;
              A.vx = B.vx * 0.5;
              B.vx = temp * 0.5;
            }
          } else {
            const push = overlapY / 2;
            if (A.y + A.height / 2 < B.y + B.height / 2) {
              if (!A.isGrabbed) A.y -= push;
              if (!B.isGrabbed) B.y += push;
              // Add bounce
              const temp = A.vy;
              A.vy = B.vy * 0.4;
              B.vy = temp * 0.4;
            } else {
              if (!A.isGrabbed) A.y += push;
              if (!B.isGrabbed) B.y -= push;
              const temp = A.vy;
              A.vy = B.vy * 0.4;
              B.vy = temp * 0.4;
            }
          }
        }
      }
    }

    // 3. Draw frames by translating elements
    bodies.forEach(body => {
      const el = body.domElement;
      el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}rad)`;
    });

    animationFrameRef.current = requestAnimationFrame(updatePhysicsLoop);
  };

  return null; // logic-only engine
};

export default AntigravityEngine;
