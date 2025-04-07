/* eslint-disable no-nested-ternary */
/* eslint-disable indent */
import express from "express";
import db from "../../models/index";
import { isAdmin, cors, jwtMiddleware } from "../../middleware";

const router = express.Router();
const Product = db.product;

router.get("/", async (req, res) => {
  const category = req.query.category ? { category: req.query.category } : {};
  const searchKeyword = req.query.searchKeyword
    ? {
        name: {
          $regex: req.query.searchKeyword,
          $options: "i",
        },
      }
    : {};
  const order = req.query.sortOrder;
  let sortOrder = { createdAt: -1 };
  if (order === "newest") sortOrder = { createdAt: -1 };
  if (order === "lowest") sortOrder = { price: 1 };
  if (order === "highest") sortOrder = { price: -1 };
  try {
    const products = await Product.find({ ...category, ...searchKeyword }).sort(
      sortOrder
    );
    return res.send(products);
  } catch (e) {
    console.log("Error list products: ", e);
    return res.status(500).send({ message: " Error Listing Products." });
  }
});

// product detail in cart view
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
      return res.send(product);
    }
    return res.status(404).send({ message: "Product Not Found." });
  } catch (e) {
    console.log("Error on product details: ", e);
    return res.status(500).send({ message: "Internal server error." });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const review = {
        userNickname: req.body.userNickname,
        name: req.body.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;
      try {
        const updatedProduct = await product.save();
        return res.status(201).send({
          data: updatedProduct.reviews[updatedProduct.reviews.length - 1],
          message: "Review saved successfully.",
        });
      } catch (e) {
        return res
          .status(404)
          .send({ message: "Error saving product review, try later." });
      }
    } else {
      return res.status(404).send({ message: "Product Not Found" });
    }
  } catch (e) {
    console.log("Error saving product review: ", e);
    return res.status(500).send({ message: "Error saving product review." });
  }
});

router.put(
  "/:id",
  [cors, jwtMiddleware, isAdmin],
  // eslint-disable-next-line consistent-return
  async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId);
      if (product) {
        product.name = req.body.name;
        product.price = req.body.price;
        product.image = req.body.image;
        product.brand = req.body.brand;
        product.category = req.body.category;
        product.countInStock = req.body.countInStock;
        product.description = req.body.description;
        try {
          const updatedProduct = await product.save();
          if (updatedProduct) {
            return res
              .status(200)
              .send({ message: "Product Updated", data: updatedProduct });
          }
        } catch (e) {
          console.log(e);
        }
      }
    } catch (e) {
      console.log("Error update product: ", e);
      return res.status(500).send({ message: " Error in Updating Product." });
    }
  }
);

router.delete("/:id", [cors, jwtMiddleware, isAdmin], async (req, res) => {
  try {
    const deletedProduct = await Product.findById(req.params.id);
    if (deletedProduct) {
      const result = await Product.deleteOne({ _id: req.params.id }); // Use deleteOne
      return res.send({ message: "Product deleted successfully.", result });
    }
    return res.status(404).send({ message: "Product Not Found." });
  } catch (e) {
    console.log("Error on product deletion: ", e);
    return res.status(500).send({ message: "Error Deleting Product." });
  }
});

router.post("/", [cors, jwtMiddleware, isAdmin], async (req, res) => {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    image: req.body.image,
    brand: req.body.brand,
    category: req.body.category,
    countInStock: req.body.countInStock,
    description: req.body.description,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
  });
  try {
    const newProduct = await product.save();
    if (newProduct) {
      return res
        .status(201)
        .send({ message: "New Product Created", data: newProduct });
    }
    return res.status(500).send({ message: " Error Creating Product." });
  } catch (e) {
    console.log("Error on save product: ", e);
    return res.status(500).send({ message: " Error Creating Product." });
  }
});

export default router;
