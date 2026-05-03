const Purchase = require("../models/Purchase");

// @desc    Add a new purchase bill
// @route   POST /api/purchases/add
exports.addPurchase = async (req, res) => {
  try {
    const { companyName, purchaseDate, items, paidAmount } = req.body;

    if (!companyName || !purchaseDate || !items || items.length === 0) {
      return res.status(400).json({ message: "Company name, date, and at least one item are required." });
    }

    // Calculate item totals and grand total
    let grandTotal = 0;
    const processedItems = items.map(item => {
      const itemTotal = Number(item.quantity) * Number(item.price);
      grandTotal += itemTotal;
      return {
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        itemTotal
      };
    });

    const paid = Number(paidAmount) || 0;
    const dueAmount = grandTotal - paid;

    const newPurchase = new Purchase({
      adminId: req.admin.id,
      companyName,
      purchaseDate,
      items: processedItems,
      grandTotal,
      paidAmount: paid,
      dueAmount
    });

    const savedPurchase = await newPurchase.save();
    res.status(201).json({ message: "Purchase bill recorded successfully", purchase: savedPurchase });
  } catch (err) {
    res.status(500).json({ message: "Error adding purchase bill", error: err.message });
  }
};

// @desc    Get all purchase bills
// @route   GET /api/purchases
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ adminId: req.admin.id }).sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Error fetching purchase bills", error: err.message });
  }
};

// @desc    Update a purchase bill
// @route   PUT /api/purchases/update/:id
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, purchaseDate, items, paidAmount } = req.body;

    if (!companyName || !purchaseDate || !items || items.length === 0) {
      return res.status(400).json({ message: "Company name, date, and at least one item are required." });
    }

    let grandTotal = 0;
    const processedItems = items.map(item => {
      const itemTotal = Number(item.quantity) * Number(item.price);
      grandTotal += itemTotal;
      return {
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        itemTotal
      };
    });

    const paid = Number(paidAmount) || 0;
    const dueAmount = grandTotal - paid;

    const updatedPurchase = await Purchase.findOneAndUpdate(
      { _id: id, adminId: req.admin.id },
      { companyName, purchaseDate, items: processedItems, grandTotal, paidAmount: paid, dueAmount },
      { new: true, runValidators: true }
    );

    if (!updatedPurchase) {
      return res.status(404).json({ message: "Purchase bill not found" });
    }

    res.status(200).json({ message: "Purchase bill updated successfully", purchase: updatedPurchase });
  } catch (err) {
    res.status(500).json({ message: "Error updating purchase bill", error: err.message });
  }
};

// @desc    Delete a purchase bill
// @route   DELETE /api/purchases/delete/:id
exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPurchase = await Purchase.findOneAndDelete({ _id: id, adminId: req.admin.id });

    if (!deletedPurchase) {
      return res.status(404).json({ message: "Purchase bill not found" });
    }

    res.status(200).json({ message: "Purchase bill deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting purchase bill", error: err.message });
  }
};
