import { getDb } from "../../../db";
import { feedback } from "../../../db/schema";
import {
  errorResponse,
  noStoreJson,
  parseProtectedJson,
  RequestError,
} from "../security";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function POST(request: Request) {
  try {
    const payload = await parseProtectedJson<{
      message?: string;
      email?: string;
      sessionId?: string;
    }>(request, {
      bucket: "feedback",
      limit: 5,
      windowSeconds: 600,
    });
    const message = payload.message?.trim() ?? "";
    const email = payload.email?.trim().slice(0, 180) ?? "";
    const candidateSessionId = payload.sessionId?.trim() ?? "";
    const sessionId = SESSION_ID_PATTERN.test(candidateSessionId)
      ? candidateSessionId
      : "anonymous";

    if (message.length < 8 || message.length > 2000) {
      throw new RequestError(400, "Comentario inválido");
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      throw new RequestError(400, "Correo inválido");
    }

    const [row]=await getDb().insert(feedback).values({message,email,sessionId}).returning({id:feedback.id});
    return noStoreJson({ id: row.id }, 201);
  } catch (error) {
    return errorResponse(error, "No fue posible guardar el comentario");
  }
}
