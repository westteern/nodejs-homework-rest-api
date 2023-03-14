const { PORT } = process.env;

const verifyEmail = (email, verificationToken) => {
  const mail = {
    to: email,
    subject: "Verify email",
    html: `<a href="http://localhost:${PORT}/api/auth/verify/${verificationToken}">Confirm email</a>`,
  };
  return mail;
};

module.exports = verifyEmail;
