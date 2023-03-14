const express = require("express");
const ctrl = require("../../controllers/authController");
const { schemas } = require("../../models/user");
const { validateBody, authenticate, upload } = require("../../middleware");

const router = express.Router();

router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

router.get("/verify/:verificationToken", ctrl.verify);

router.post("/verify", validateBody(schemas.verifyShema), ctrl.resendVerify);

router.get("/login", validateBody(schemas.loginSchema), ctrl.login);

router.post("/logout", authenticate, ctrl.logout);

router.get("/current", authenticate, ctrl.getCurrent);

router.patch(
  "/",
  authenticate,
  validateBody(schemas.subscriptionSchema),
  ctrl.updateSub
);

router.patch("/avatars", authenticate, upload.single("avatar"), ctrl.updateAva);

module.exports = router;
