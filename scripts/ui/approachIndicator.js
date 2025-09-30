import { WORLD, DEG } from "../config/constants.js";

export function createApproachIndicator(canvas) {
  return {
    draw(ctx, lander, terrain, viewHeight) {
      const altitude = lander.getAltitude(terrain);

      // Only show when approaching (below 400 ft)
      if (altitude > 400 || lander.landed || lander.crashed) {
        return;
      }

      ctx.save();

      // Draw safe zone indicator on ground
      const surface = terrain.getSurfaceAt(lander.position.x);
      const isPad = surface.type === "pad";

      if (isPad) {
        const pad = terrain.getPad(surface.padId);
        if (pad) {
          const zoneWidth = pad.x2 - pad.x1;
          const zoneLeft = pad.x1;
          const zoneRight = pad.x2;

          // Draw approach corridor
          ctx.strokeStyle = "rgba(36, 245, 161, 0.4)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(zoneLeft, surface.y);
          ctx.lineTo(zoneLeft, surface.y - 300);
          ctx.moveTo(zoneRight, surface.y);
          ctx.lineTo(zoneRight, surface.y - 300);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw target indicator on pad
          const targetX = (zoneLeft + zoneRight) / 2;
          ctx.strokeStyle = "rgba(36, 245, 161, 0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(targetX, surface.y - 10, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(targetX - 12, surface.y - 10);
          ctx.lineTo(targetX + 12, surface.y - 10);
          ctx.moveTo(targetX, surface.y - 22);
          ctx.lineTo(targetX, surface.y + 2);
          ctx.stroke();
        }
      }

      // Draw velocity vector
      const vectorScale = 30;
      const velocityEndX = lander.position.x + lander.velocity.x * vectorScale;
      const velocityEndY = lander.position.y + lander.velocity.y * vectorScale;

      ctx.strokeStyle = "rgba(255, 200, 50, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lander.position.x, lander.position.y);
      ctx.lineTo(velocityEndX, velocityEndY);
      ctx.stroke();

      // Draw arrow head
      const angle = Math.atan2(lander.velocity.y, lander.velocity.x);
      const arrowSize = 8;
      ctx.fillStyle = "rgba(255, 200, 50, 0.8)";
      ctx.beginPath();
      ctx.moveTo(velocityEndX, velocityEndY);
      ctx.lineTo(
        velocityEndX - arrowSize * Math.cos(angle - Math.PI / 6),
        velocityEndY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        velocityEndX - arrowSize * Math.cos(angle + Math.PI / 6),
        velocityEndY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Predicted impact point (simplified)
      if (altitude < 300) {
        const timeToImpact = Math.max(0, altitude / Math.max(0.1, Math.abs(lander.velocity.y)));
        const predictedX = lander.position.x + lander.velocity.x * timeToImpact * 50;
        const predictedSurface = terrain.getSurfaceAt(predictedX);

        ctx.strokeStyle = "rgba(255, 100, 100, 0.6)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(lander.position.x, lander.position.y);
        ctx.lineTo(predictedX, predictedSurface.y - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255, 100, 100, 0.4)";
        ctx.beginPath();
        ctx.arc(predictedX, predictedSurface.y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Angle indicator
      const landerAngleDeg = (lander.angle + Math.PI / 2) * (180 / Math.PI);
      const angleOk = Math.abs(landerAngleDeg) < WORLD.safeAngle;
      ctx.save();
      ctx.translate(lander.position.x, lander.position.y - 40);
      ctx.strokeStyle = angleOk ? "rgba(100, 255, 100, 0.8)" : "rgba(255, 100, 100, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3);
      ctx.stroke();
      ctx.rotate(lander.angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(0, -25);
      ctx.stroke();
      ctx.restore();

      // Landing lights
      if (altitude < 300) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(lander.position.x, lander.position.y);
        ctx.rotate(lander.angle + Math.PI / 2);

        const gradient = ctx.createRadialGradient(0, 25, 0, 0, 25, 150);
        gradient.addColorStop(0, "rgba(255, 255, 200, 0.3)");
        gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-20, 25);
        ctx.lineTo(20, 25);
        ctx.lineTo(40, 175);
        ctx.lineTo(-40, 175);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }
  };
}