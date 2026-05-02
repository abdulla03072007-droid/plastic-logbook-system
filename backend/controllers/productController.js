const Product = require("../models/Product");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { productName, productType, size, quantity, price, stockAvailable } = req.body;

    // Validate input
    if (!productName || !productType || !size || !price) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const newProduct = new Product({
      adminId: req.admin.id,
      productName,
      productType,
      size,
      quantity: quantity || 0,
      price,
      stockAvailable: stockAvailable || 0
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;

    let query = { adminId: req.admin.id };
    if (search) {
      query.$and = [
        { adminId: req.admin.id },
        {
          $or: [
            { productName: { $regex: search, $options: "i" } },
            { productType: { $regex: search, $options: "i" } },
            { size: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, adminId: req.admin.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, productType, size, quantity, price, stockAvailable } = req.body;

    let product = await Product.findOne({ _id: id, adminId: req.admin.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Update fields
    if (productName) product.productName = productName;
    if (productType) product.productType = productType;
    if (size) product.size = size;
    if (quantity !== undefined) product.quantity = quantity;
    if (price) product.price = price;
    if (stockAvailable !== undefined) product.stockAvailable = stockAvailable;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOneAndDelete({ _id: id, adminId: req.admin.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
