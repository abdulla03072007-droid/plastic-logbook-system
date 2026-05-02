const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// ADD PROD
  router.post("/add", async (req, res) => {
  try {
    const data = req.body;

    // ✅ If array → insert many
    if (Array.isArray(data)) {
      const productsWithAdmin = data.map(p => ({ ...p, adminId: req.admin.id }));
      await Product.insertMany(productsWithAdmin);
      return res.json({ message: "Multiple products added" });
    }

    // ✅ If single object
    const {
      productName,
      productType,
      size,
      quantity,
      price,
      stockAvailable
    } = data;

    if (
      !productName ||
      !productType ||
      !size ||
      !quantity ||
      !price ||
      !stockAvailable
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required" });
    }

    const newProduct = new Product({
      ...data,
      adminId: req.admin.id
    });
    await newProduct.save();

    res.json({ message: "Product added successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ adminId: req.admin.id }).sort({
      createdAt: -1
    });

    res.status(200).json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
// UPDATE PRODUCT
router.put("/update/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin.id },
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

/// DELETE PRODUCT
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin.id
    });

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;