import type { Request, Response } from "express";
import { createOrder } from "../services/order.services";

export async function checkout(req: Request, res: Response) {
  const userId = req.user?.id;
  const { shippingName, shippingAddress } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication Failed",
    });
  }

  if (
    typeof shippingName !== "string" ||
    !shippingName.trim() ||
    typeof shippingAddress !== "string" ||
    !shippingAddress.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Shipping name and address are required",
    });
  }

  try {
    const order = await createOrder({
      userId,
      shippingName: shippingName.trim(),
      shippingAddress: shippingAddress.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_EMPTY") {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        success: false,
        message: "One or more items no longer have enough stock",
      });
    }

    console.error("Checkout failed", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
}
