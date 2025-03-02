import express from "express";
import db from "../../models/index";
import { isAdmin, cors, jwtMiddleware } from "../../middleware";

const router = express.Router();
const Order = db.order;

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user");
    return res.send(orders);
  } catch (e) {
    console.log("Error get orders: ", e);
    return res.status(500).send({ message: "Internal server error." });
  }
});

router.get("/user", [cors, jwtMiddleware], async (req, res) => {
  try {
    const orders = await Order.find({ user: req.accessTokenUserId });
    return res.send(orders);
  } catch (e) {
    console.log("Error on my order list: ", e);
    return res
      .status(500)
      .send({ message: "Internal server error. My order list unavailable." });
  }
});

router.get("/:id", [cors, jwtMiddleware], async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id }).populate("user");
    if (order) {
      return res.send(order);
    }
    return res.status(404).send("Order Not Found.");
  } catch (e) {
    console.log("Order details failed: ", e);
    return res
      .status(500)
      .send({ message: "Internal server error. Details unavailable" });
  }
});

router.delete("/:id", [cors, jwtMiddleware, isAdmin], async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id });
    if (order) {
      const deletedOrder = await order.remove();
      return res.send(deletedOrder);
    }
    return res.status(404).send("Order Not Found.");
  } catch (e) {
    console.log("Order details failed: ", e);
    return res
      .status(500)
      .send({ message: "Internal server error. Delete not available" });
  }
});

router.post("/", [cors, jwtMiddleware], async (req, res) => {
  const newOrder = new Order({
    orderItems: req.body.orderItems,
    user: req.accessTokenUserId,
    shipping: req.body.shipping,
    payment: req.body.payment,
    itemsPrice: req.body.itemsPrice,
    taxPrice: req.body.taxPrice,
    shippingPrice: req.body.shippingPrice,
    totalPrice: req.body.totalPrice,
  });
  try {
    const newOrderCreated = await newOrder.save();
    return res
      .status(201)
      .send({ message: "New Order Created", data: newOrderCreated });
  } catch (e) {
    return res
      .status(500)
      .send({ message: "Internal server error. Order couldnt be saved." });
  }
});

router.put("/:id/pay", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.payment = {
        ...order.payment,
        paymentResult: {
          payerID: req.body.payerID,
          orderID: req.body.orderID,
          paymentID: req.body.paymentID,
        },
      };
      try {
        const updatedOrder = await order.save();
        return res.send({ message: "Order Paid.", order: updatedOrder });
      } catch (e) {
        console.log("Error saving payment/order: ", e);
        return res.status(404).send({ message: "Transaction not saved." });
      }
    }
    return res.status(404).send({ message: "Order not found." });
  } catch (e) {
    console.log("Error saving payment order: ", e);
    return res.status(404).send({ message: "Internal server error." });
  }
});

export default router;
