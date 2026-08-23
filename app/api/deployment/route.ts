import { NextResponse } from "next/server";
import { readDeploymentIdentity } from "../../deployment-identity";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "no-store, no-cache, max-age=0, must-revalidate";

export async function GET() {
  return NextResponse.json(readDeploymentIdentity(), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
