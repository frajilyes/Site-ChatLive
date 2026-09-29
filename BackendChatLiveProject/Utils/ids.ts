import type { Types } from "mongoose";

export type Ref = Types.ObjectId | string | { _id: Types.ObjectId | string };

export function idOf(value: Ref | null | undefined): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String(value._id);
  }
  return String(value);
}

export function sameId(a: Ref | null | undefined, b: Ref | null | undefined): boolean {
  return idOf(a) === idOf(b);
}
