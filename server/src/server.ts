import express from "express";
import cors from "cors";
import { pool } from "./db/pool";
import productRoutes from "./routes/product.route";
import cartRoutes from "./routes/cart.route";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/auth.routes";
import orderRoutes from "./routes/order.route";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

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
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
