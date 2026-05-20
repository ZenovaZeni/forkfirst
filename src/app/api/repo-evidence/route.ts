import { NextResponse } from "next/server";
import { prepareRepoForHandoff } from "@/lib/repo-evidence/prepare";
import type { NormalizedRepo } from "@/lib/github/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { repo?: NormalizedRepo; githubToken?: string };
    if (!body.repo?.owner || !body.repo?.name) {
      return NextResponse.json({ error: "Missing repo" }, { status: 400 });
    }

    const repo = await prepareRepoForHandoff(body.repo, body.githubToken);
    return NextResponse.json({ repo });
  } catch {
    return NextResponse.json({ error: "Unable to prepare repo evidence" }, { status: 500 });
  }
}
