const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const Transactions = require("../controllers/transactions");

router.use(protect);
router.route("/transfer").post(authorize("user"), Transactions.transfer); //ok

module.exports = router;
