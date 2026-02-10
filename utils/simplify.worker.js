// src/utils/simplify.worker.js

// Use an ES module import, which works from the src/ folder
import { simplify } from "./simplify.js";

self.onmessage = function (e) {
  const { points, tolerance } = e.data;

  // 1. Map data to the format the simplify algorithm expects
  const algoPoints = points.map((p) => ({ x: p.lat, y: p.lng }));

  // 2. Create a map to get back our original data objects
  const pointMap = new Map(points.map((p) => [`${p.lat},${p.lng}`, p]));

  // 3. Run the simplification
  const simplifiedAlgoPoints = simplify(algoPoints, tolerance);

  // 4. Map the simplified {x,y} points back to our full data objects
  const simplifiedData = simplifiedAlgoPoints
    .map((p) => pointMap.get(`${p.x},${p.y}`))
    .filter(Boolean); // Filter out any potential nulls

  // 5. Send the simplified array of objects back
  self.postMessage(simplifiedData);
};