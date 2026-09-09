import { NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";

export function handleSocialError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
