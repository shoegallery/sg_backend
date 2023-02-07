const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const PushNotification = require("../controllers/pushnof");



router.post("/sent", PushNotification.PushNof);
router.post("/get", PushNotification.getToken);


module.exports = router;
