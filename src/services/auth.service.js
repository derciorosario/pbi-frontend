const { OAuth2Client } = require("google-auth-library");
const { User, Profile } = require("../models");
const { sign } = require("../utils/jwt");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleIdToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload(); // { sub, email, email_verified, name, picture, hd?, ... }
  return payload;
}

async function loginWithGoogle({ idToken, accountType = "individual" }) {
  const payload = await verifyGoogleIdToken(idToken);
  const {
    sub: googleId,
    email,
    email_verified: emailVerified,
    name,
    picture,
    hd, // hosted domain (for Workspace)
  } = payload || {};

  if (!email || !emailVerified) {
    const e = new Error("Google account email not verified");
    e.status = 403;
    throw e;
  }

  // Optional domain restriction
  if (process.env.GOOGLE_ALLOWED_HOSTED_DOMAIN && process.env.GOOGLE_ALLOWED_HOSTED_DOMAIN !== hd) {
    const e = new Error("Unauthorized Google domain");
    e.status = 403;
    throw e;
  }

  // Find by googleId first, or by email (link account)
  let user = await User.findOne({ where: { googleId } });
  if (!user) {
    user = await User.findOne({ where: { email } });
  }

  if (!user) {
    // create new user (no passwordHash for Google-only accounts)
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      passwordHash: "GOOGLE_AUTH", // placeholder; not used for login
      accountType,                  // default or client-provided
      isVerified: true,             // Google verified email
      provider: "google",
      googleId,
      avatarUrl: picture || null,
    });
    await Profile.create({ userId: user.id }); // shell profile
  } else {
    // ensure fields are up-to-date and provider linked
    user.googleId = user.googleId || googleId;
    user.provider = "google";
    user.isVerified = true;
    if (picture && user.avatarUrl !== picture) user.avatarUrl = picture;
    await user.save();
  }

  const token = sign({ sub: user.id, email: user.email, accountType: user.accountType });
  return { user, token };
}

module.exports = {
  // existing exports...
  loginWithGoogle,
};
