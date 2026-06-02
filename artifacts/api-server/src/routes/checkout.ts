import { Router } from "express";
import { resolveCheckoutUrl } from "../lib/seeit";

const checkoutRouter = Router();

checkoutRouter.get("/checkout-url", async (req, res) => {
  const applicantName = (req.query["name"] as string) ?? "";
  try {
    const result = await resolveCheckoutUrl(applicantName);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to resolve checkout URL");
    res.status(500).json({ error: "Failed to resolve checkout URL" });
  }
});

export default checkoutRouter;
