import { NextResponse } from "next/server";
import { repo } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await repo().deleteSet(id);
  return NextResponse.json({ ok: true });
}
