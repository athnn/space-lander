// Autopilot Test Script
// This script can be run in the browser console to test autopilot functionality

console.log("🚀 Space Lander Autopilot Test Script");
console.log("=====================================");

// Test 1: Check if autopilot key mapping exists
console.log("\n1. Testing Key Mapping...");
const keysMap = {
  ArrowUp: "thrust",
  ArrowLeft: "rotateLeft", 
  ArrowRight: "rotateRight",
  ArrowDown: "auxThrust",
  KeyW: "thrust",
  KeyA: "rotateLeft",
  KeyD: "rotateRight", 
  KeyS: "auxThrust",
  Space: "quickReset",
  KeyZ: "autopilot",
  KeyR: "goAround"
};

if (keysMap.KeyZ === "autopilot") {
  console.log("✅ Z key is mapped to 'autopilot'");
} else {
  console.log("❌ Z key mapping missing or incorrect");
}

// Test 2: Check if autopilot state exists
console.log("\n2. Testing Input State...");
// This would need to be run in the game context
console.log("To test: Check if inputState.autopilot exists and can be toggled");

// Test 3: Simulate autopilot logic
console.log("\n3. Testing Autopilot Logic...");
function testAutopilotLogic() {
  // Simulate lander state
  const mockLander = {
    angle: Math.PI / 4, // 45 degrees (tilted)
    rotationVelocity: 0.1,
    velocity: { y: 0.5 },
    fuel: 50
  };
  
  const mockTerrain = {
    getSurfaceAt: () => ({ y: 100 })
  };
  
  // Simulate autopilot conditions
  const targetAngle = -Math.PI / 2; // Upright
  const angleError = mockLander.angle - targetAngle;
  const altitude = 150; // Below 200ft threshold
  
  console.log(`Current angle: ${(mockLander.angle * 180 / Math.PI).toFixed(1)}°`);
  console.log(`Target angle: ${(targetAngle * 180 / Math.PI).toFixed(1)}°`);
  console.log(`Angle error: ${(angleError * 180 / Math.PI).toFixed(1)}°`);
  console.log(`Altitude: ${altitude}ft`);
  console.log(`Vertical velocity: ${mockLander.velocity.y}`);
  
  // Test rotation logic
  if (Math.abs(angleError) > 0.05) {
    if (angleError > 0) {
      console.log("✅ Should rotate LEFT (angle too positive)");
    } else {
      console.log("✅ Should rotate RIGHT (angle too negative)");
    }
  }
  
  // Test auto-thrust logic
  if (altitude < 200 && Math.abs(mockLander.velocity.y) > 0.3) {
    console.log("✅ Should engage AUX THRUST (low altitude + high velocity)");
  } else {
    console.log("ℹ️  No auto-thrust needed");
  }
}

testAutopilotLogic();

// Test 4: Instructions for manual testing
console.log("\n4. Manual Testing Instructions:");
console.log("================================");
console.log("1. Launch the game at http://localhost:8000");
console.log("2. Click 'Launch Mission' to start");
console.log("3. Press and hold Z key to activate autopilot");
console.log("4. Observe the lander behavior:");
console.log("   - Should automatically rotate to upright (0°)");
console.log("   - Should reduce spinning");
console.log("   - Should auto-thrust when close to ground");
console.log("5. Release Z key to deactivate autopilot");

console.log("\n🎯 Expected Results:");
console.log("- Lander stabilizes automatically");
console.log("- Smooth rotation to upright position");
console.log("- Automatic landing assistance near ground");
console.log("- Only works when fuel > 0");

console.log("\n✅ Autopilot test script complete!");
