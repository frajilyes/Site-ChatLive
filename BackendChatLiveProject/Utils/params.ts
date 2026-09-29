import type { Request } from "express";

export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    return value[value.length - 1] ?? "";
  }
  return value ?? "";
}
