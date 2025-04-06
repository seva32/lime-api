import { verifyJWTToken, verifyRefreshToken } from "../functions/jwt";
import { cookiesOptions } from "../contollers/config";

function jwtMiddleware(req, res, next) {
  const token = req.get("X-Access-Token");

  if (!token && !req.cookies.refreshToken) {
    return res.status(401).send({ message: err.message });
  } else if (req.cookies.refreshToken) {
    verifyRefreshToken(req.cookies.refreshToken, req.fingerprint)
      .then((newTokens) => {
        res.cookie("refreshToken", newTokens.refreshToken, cookiesOptions);
        res.setHeader("x-update-token", newTokens.accessToken);
        if (token) {
          verifyJWTToken(token)
            .then((accessTokenUserId) => {
              req.accessTokenUserId = accessTokenUserId;
              return next();
            })
            .catch((err) => {
              return res.status(401).send({ message: err.message });
            });
        } else {
          verifyJWTToken(newTokens.accessToken)
            .then((accessTokenUserId) => {
              req.accessTokenUserId = accessTokenUserId;
              return next();
            })
            .catch((err) => {
              console.log(err.message);
              return res.status(401).send({ message: err.message });
            });
        }
      })
      .catch((err) => {
        return res.status(401).send({ message: err.message });
      });
  } else {
    verifyJWTToken(token)
      .then((accessTokenUserId) => {
        req.accessTokenUserId = accessTokenUserId;
        return next();
      })
      .catch((err) => {
        console.log(err.message);
        return res.status(401).send({ message: err.message });
      });
  }
}

export default jwtMiddleware;
