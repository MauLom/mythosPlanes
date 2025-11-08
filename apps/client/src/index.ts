import type { Plane } from "@mythos/types";

const displayPlane = (plane: Plane): void => {
  console.log(`Plane: ${plane.name}`);
  console.log(`Description: ${plane.description}`);
};

const main = (): void => {
  const plane: Plane = {
    id: "1",
    name: "The Astral Realm",
    description: "A mystical plane of existence beyond the material world",
  };

  console.log("Welcome to mythosPlanes Client!");
  displayPlane(plane);
};

main();
