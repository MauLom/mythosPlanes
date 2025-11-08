// Shared types for the mythosPlanes application

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Plane {
  id: string;
  name: string;
  description: string;
}

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
