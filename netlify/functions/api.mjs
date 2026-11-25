import { handleApiRequest } from "../../api/lib/handler.js";

export default async (request, context) => {
  return handleApiRequest(request, null, context);
};
