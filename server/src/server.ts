import express from "express";
import cors from "cors";
import { pool } from "./db/pool";
import productRoutes from "./routes/product.route";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      message: "Server Is RUNNING!",
      database_time: result.rows[0].now,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Database Connection failed",
    });
  }
});

app.use("/api/products", productRoutes);
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
