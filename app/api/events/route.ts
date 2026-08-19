import { getDb } from "../../../db";
import { events } from "../../../db/schema";
import {
  errorResponse,
  noStoreJson,
  parseProtectedJson,
  RequestError,
} from "../security";

const ALLOWED=new Set(["workflow_started","workflow_completed"]);
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function POST(request: Request) {
  try {
    const payload = await parseProtectedJson<{ name?: string; sessionId?: string }>(
      request,
      { bucket: "events", limit: 30, windowSeconds: 60 },
    );
    const name = payload.name ?? "";
    const candidateSessionId = payload.sessionId?.trim() ?? "";
    const sessionId = SESSION_ID_PATTERN.test(candidateSessionId)
      ? candidateSessionId
      : "anonymous";
    if (!ALLOWED.has(name)) throw new RequestError(400, "Evento inválido");
    const [row]=await getDb().insert(events).values({name,sessionId}).returning({id:events.id});
    return noStoreJson({ id: row.id }, 201);
  } catch (error) {
    return errorResponse(error, "Evento no guardado");
  }
}
