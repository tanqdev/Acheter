import type { Request, Response } from "express";
import {
  addToCart,
  deleteFromCart,
  getCart,
  updateCartQuantity,
} from "../services/cart.services";

export async function getCartItems(req: Request, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication Failed",
    });
  }
  try {
    const cartItems = await getCart(userId);
    return res.status(200).json({
      success: true,
      cartItems,
    });
  } catch (e) {
    console.error("Failed to fetch cart", e);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
}

export async function addCartItems(req: Request, res: Response) {
  const userId = req.user?.id;

  const { productId, quantity } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication Failed",
    });
  }
  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid Product ID or Quantity",
    });
  }
  try {
    const cartItem = await addToCart(userId, productId, quantity);

    return res.status(200).json({
      success: true,
      cartItem,
    });
  } catch (e) {
    console.error("Failed to add item to cart", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add item to cart" });
  }
}

export async function updateCartItems(req: Request, res: Response) {
  const userId = req.user?.id;

  const productId = Number(req.params.productId);
  const { quantity } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication Failed",
    });
  }
  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid Product ID or Quantity",
    });
  }
  try {
    const cartItem = await updateCartQuantity(userId, productId, quantity);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(200).json({
      success: true,
      cartItem,
    });
  } catch (e) {
    console.error("Failed to update cart", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update cart" });
  }
}

export async function deleteCartItem(req: Request, res: Response) {
  const userId = req.user?.id;
  const productId = Number(req.params.productId);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication Failed",
    });
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid Product ID",
    });
  }
  try {
    const cartItem = await deleteFromCart(userId, productId);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item Removed From Cart",
      cartItem,
    });
  } catch (e) {
    console.error("Failed to remove cart item", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to remove cart item" });
  }
}
