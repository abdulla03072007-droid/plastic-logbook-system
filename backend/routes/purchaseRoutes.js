const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.post("/add", purchaseController.addPurchase);
router.get("/", purchaseController.getPurchases);
router.put("/update/:id", purchaseController.updatePurchase);
router.delete("/delete/:id", purchaseController.deletePurchase);

module.exports = router;
