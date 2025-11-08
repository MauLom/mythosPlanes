import type { User } from "@mythos/types";

const greetUser = (user: User): string => {
  return `Hello, ${user.name}! Welcome to mythosPlanes Server.`;
};

const main = (): void => {
  const user: User = {
    id: "1",
    name: "Demo User",
    email: "demo@mythosplanes.com",
  };

  console.log(greetUser(user));
  console.log("Server is ready!");
};

main();
