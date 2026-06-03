import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./swagger.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get("/api/websites", (_req, res) => {
  res.json([]);
});

app.post("/api/websites", (_req, res) => {
  res.status(501).json({ message: "Website creation endpoint skeleton" });
});

app.get("/api/executions", (_req, res) => {
  res.json([]);
});

app.post("/api/websites/:id/executions", (req, res) => {
  res.status(501).json({
    message: "Manual execution endpoint skeleton",
    websiteRecordId: req.params.id
  });
});

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});
