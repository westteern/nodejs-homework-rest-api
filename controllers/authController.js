const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const { SECRET_KEY } = process.env;
const avatarsDir = path.join(__dirname, "../", "public", "avatars");
// console.log(avatarsDir);

const { User } = require("../models/user");
const {
  RequestError,
  ctrlWrapper,
  sendEmail,
  verifyEmail,
} = require("../utils");

// -----Register----- //
const registration = async (req, res) => {
  const { password, email, subscribtion } = req.body;
  const mailAudit = await User.findOne({ email });
  if (mailAudit) {
    throw RequestError(409, "Email in use");
  }
  const avatartURL = gravatar.url(email);
  const verificationToken = nanoid();
  const result = await User.create({
    password,
    email,
    subscribtion,
    avatartURL,
    verificationToken,
  });

  const mail = verifyEmail(email, verificationToken);
  await sendEmail(mail);

  res.status(201).json({
    email: result.email,
    subscribtion,
  });
};

// -----Login----- //
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw RequestError(401, "Email or password is wrong");
  }
  if (!user.verify) {
    throw RequestError(
      401,
      "Email not verify, check your email for verification"
    );
  }
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    throw RequestError(401, "Email or password is wrong");
  }
  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "10h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};
// -----Logout----- //
const logoutUser = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.json({
    message: "Logout saccess",
  });
};
// -----Get current user----- //
const currentUser = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};
// -----Update subscription----- //
const updateSubscription = async (req, res) => {
  const { _id } = req.user;
  const { subscription } = req.body;
  if (!subscription) {
    throw RequestError(400);
  }
  const user = await User.findByIdAndUpdate(
    _id,
    { subscription },
    { new: true }
  );
  res.json({
    email: user.email,
    subscription: user.subscription,
  });
};
// -----Update avatar----- //
const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tmpDir, originalname } = req.file;
  const extension = originalname.split(".").pop();
  const avatarName = `${_id}.${extension}`;
  const result = path.join(avatarsDir, avatarName);
  await fs.rename(tmpDir, result);
  const resizeAvatar = await Jimp.read(result);
  await resizeAvatar.resize(250, 250).write(result);
  const avatartURL = path.join("avatars", avatarName);

  await User.findByIdAndUpdate(_id, { avatartURL });
  res.json({
    avatartURL,
  });
};
// -----Verify user email----- //
const verifyUser = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw RequestError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });
  res.json({ message: "Verification successful" });
};
// -----Resend verification email----- //
const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw RequestError(400, "Missing required field email");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw RequestError(404);
  }
  if (user.verify) {
    throw RequestError(400, "Verification has already been passed");
  }
  const mail = verifyEmail(email, user.verificationToken);
  await sendEmail(mail);

  res.json({ message: "Verification email sent" });
};

module.exports = {
  register: ctrlWrapper(registration),
  login: ctrlWrapper(loginUser),
  getCurrent: ctrlWrapper(currentUser),
  logout: ctrlWrapper(logoutUser),
  updateSub: ctrlWrapper(updateSubscription),
  updateAva: ctrlWrapper(updateAvatar),
  verify: ctrlWrapper(verifyUser),
  resendVerify: ctrlWrapper(resendVerifyEmail),
};
