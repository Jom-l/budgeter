import { getTips } from "../services/aiService.js";

export async function tips(req, res) {
  const force = req.query.force === "true" || req.method === "POST";
  const result = await getTips(req.session.userId, { force });
  res.json({ tips: result });
}
