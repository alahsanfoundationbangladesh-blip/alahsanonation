import { handleApiRequest } from "./lib/handler.js";

export default async function handler(req, res) {
  return handleApiRequest(req, res);
}
