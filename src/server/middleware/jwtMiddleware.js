import { verifyJWTToken, verifyRefreshToken } from "../functions/jwt";
import { cookiesOptions } from "../contollers/config";

async function jwtMiddleware(req, res, next) {
  const token = req.get("X-Access-Token");
  const refreshToken = req.cookies.refreshToken;

  // No tokens provided
  if (!token && !refreshToken) {
    return res
      .status(401)
      .send({ message: "Access denied. No tokens provided." });
  }

  try {
    // If refresh token exists, try refreshing tokens
    if (refreshToken) {
      const newTokens = await verifyRefreshToken(refreshToken, req.fingerprint);
      res.cookie("refreshToken", newTokens.refreshToken, cookiesOptions);
      res.setHeader("x-update-token", newTokens.accessToken);

      const userId = await verifyJWTToken(token || newTokens.accessToken);
      req.accessTokenUserId = userId;
      return next();
    }

    // If only access token exists
    const userId = await verifyJWTToken(token);
    req.accessTokenUserId = userId;
    return next();
  } catch (err) {
    console.error("JWT Middleware Error:", err.message);
    return res.status(401).send({ message: err.message });
  }
}

export default jwtMiddleware;
