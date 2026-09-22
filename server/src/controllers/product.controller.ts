import type { Request, Response } from "express";
import {
  getAllProducts,
  getAllProductsByID,
} from "../services/product.service";

export async function getProducts(_req: Request, res: Response) {
  try {
    const products = await getAllProducts();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Failed to fetch products");

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }
    const product = await getAllProductsByID(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }
    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Failed to fetch product", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
}
