import { sql } from "drizzle-orm";
import { ensureDatabaseSchema, getDb } from "../../db";
import { rateLimits } from "../../db/schema";

const encoder = new TextEncoder();

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
  }
}

type RequestPolicy = {
  bucket: string;
  limit: number;
  windowSeconds: number;
  maxBytes?: number;
};

export async function parseProtectedJson<T>(
  request: Request,
  policy: RequestPolicy,
): Promise<T> {
  assertSameOrigin(request);

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new RequestError(415, "Se requiere contenido JSON");
  }

  await enforceRateLimit(request, policy);
  const text = await readBoundedBody(request, policy.maxBytes ?? 4096);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RequestError(400, "JSON inválido");
  }
}

export function errorResponse(error: unknown, fallback: string): Response {
  const known = error instanceof RequestError;
  const status = known ? error.status : 500;
  const headers = new Headers({ "cache-control": "no-store" });
  if (known && error.retryAfter) {
    headers.set("retry-after", String(error.retryAfter));
  }

  return Response.json(
    { error: known ? error.message : fallback },
    { status, headers },
  );
}

export function noStoreJson(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function enforceRateLimit(
  request: Request,
  policy: RequestPolicy,
): Promise<void> {
  await ensureDatabaseSchema();
  const now = Date.now();
  const cutoff = now - policy.windowSeconds * 1000;
  const fingerprint = await requestFingerprint(request);
  const key = `${policy.bucket}:${fingerprint}`;

  const [row] = await getDb()
    .insert(rateLimits)
    .values({ key, windowStartedAt: now, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql<number>`CASE WHEN ${rateLimits.windowStartedAt} < ${cutoff} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStartedAt: sql<number>`CASE WHEN ${rateLimits.windowStartedAt} < ${cutoff} THEN ${now} ELSE ${rateLimits.windowStartedAt} END`,
      },
    })
    .returning({
      count: rateLimits.count,
      windowStartedAt: rateLimits.windowStartedAt,
    });

  if (row.count > policy.limit) {
    const remainingMs = Math.max(
      1000,
      row.windowStartedAt + policy.windowSeconds * 1000 - now,
    );
    throw new RequestError(
      429,
      "Demasiadas solicitudes. Intenta de nuevo más tarde.",
      Math.ceil(remainingMs / 1000),
    );
  }
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let expected: string;
  try {
    expected = new URL(request.url).origin;
  } catch {
    throw new RequestError(400, "Solicitud inválida");
  }

  if (origin !== expected) {
    throw new RequestError(403, "Origen no permitido");
  }
}

async function readBoundedBody(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestError(413, "Solicitud demasiado grande");
  }
  if (!request.body) throw new RequestError(400, "Solicitud vacía");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new RequestError(413, "Solicitud demasiado grande");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function requestFingerprint(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 200) ?? "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${ip}\n${userAgent}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
