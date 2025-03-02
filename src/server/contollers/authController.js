/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import omit from 'lodash.omit';
import waterfall from 'async/waterfall';
import db from '../models/index';
import config, { cookiesOptions } from './config';
import {
  getAccessToken,
  getRefreshToken,
  processRefreshToken,
} from '../functions/jwt';

const User = db.user;
const Role = db.role;
const Token = db.token;
const ThirdPartyProvider = db.thirdPartyProviderSchema;

export const signup = (req, res) => {
  waterfall(
    [
      // add user roles
      (callback) => {
        let rolesResult;
        if (req.body.roles) {
          Role.find(
            {
              name: { $in: req.body.roles },
            },
            (err, roles) => {
              if (err) {
                return callback(err);
              }
              rolesResult = roles.map((role) => role._id);
              return callback(null, rolesResult);
            },
          );
        } else {
          Role.findOne({ name: 'user' }, (_err, role) => {
            rolesResult = [role._id];
            return callback(null, rolesResult);
          });
        }
      },
      // add profile data from 3rd party provider
      (rolesResult, callback) => {
        let provider;
        if (req.body.profile) {
          provider = new ThirdPartyProvider({
            provider_name: req.body.profile.provider,
            provider_id: req.body.profile.id,
            provider_data: omit(req.body.profile, ['provider', 'id']),
          });
          provider.save();
          return callback(null, { rolesResult, provider });
        }

        return callback(null, { rolesResult });
      },
      // create user
      (results, callback) => {
        const user = new User({
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 8),
          nickname: req.body.nickname
            ? req.body.nickname
            : req.body.email.split('@')[0],
        });
        if (results.rolesResult) {
          user.roles = results.rolesResult;
        }
        if (results.provider) {
          user.third_party_auth.push(results.provider);
        }
        callback(null, user);
      },
      // send back accessToken, save/send refreshToken, save user
      (user, callback) => {
        const token = getAccessToken(user.id);
        getRefreshToken(user, req.fingerprint)
          .then((refreshToken) => {
            res.cookie('refreshToken', refreshToken, cookiesOptions);
            res.send({
              email: user.email,
              nickname: user.nickname,
              roles: user.roles,
              image: user.image,
              accessToken: token,
              expiryToken: config.expiryToken,
            });
            callback(null);
          })
          .catch((error) => {
            console.log(error);
            callback(error);
          });
      },
    ],
    (err) => {
      if (err) {
        console.log(
          'Singup mongoose error: ',
          err && err.message ? err.message : err,
        );
        res.status(500).send({ message: 'Internal server error' });
      }
    },
  );
};

// signout controller to handle refreshToken deletion on singout redux action
export const signout = (req, res) => {
  if (req.cookies.refreshToken) {
    Token.findOne({ refreshToken: req.cookies.refreshToken }, (err, token) => {
      if (err) {
        console.log('Singout mongoose/token error: ', err.message);
        return res.status(500).send({ message: 'Internal server error' });
      }
      if (!token) {
        return res.status(404).send({ message: 'Refresh token Not found.' });
      }

      if (req.body.email) {
        User.findOne({ email: req.body.email }, (err, user) => {
          if (err) {
            console.log('Singout mongoose/user error: ', err.message);
            return res.status(500).send({
              message: 'Internal server error',
            });
          }
          if (!user) {
            return res.status(404).send({
              message: 'User Not found.',
            });
          }

          user.token = user.token.filter((u) => !u.equals(token._id)); // eslint-disable-line

          user.save((err) => {
            if (err) {
              console.log('Singout mongoose/user error: ', err.message);
              return res.status(500).send({
                message: 'Internal server error',
              });
            }
            Token.deleteOne(
              {
                _id: token._id,
              },
              (err) => {
                if (err) {
                  console.log('Singout mongoose/token error: ', err.message);
                  return res.status(500).send({
                    message: 'Internal server error',
                  });
                }
                return res.send({
                  ok: 'ok',
                });
              },
            );
          });
        });
      } else {
        // no email in req body
        return res.status(404).send({ message: 'No email provided.' });
      }
    });
  } else {
    // no cookie.refreshToken
    return res.status(404).send({ message: 'Action forbidden.' });
  }
};

export const signin = (req, res) => {
  User.findOne({
    email: req.body.email,
  })
    .populate('roles', '-__v')
    .exec(async (err, user) => {
      if (err) {
        console.log('Singin mongoose/user error: ', err.message);
        res.status(500).send({ message: 'Internal server error' });
        return;
      }

      if (!user) {
        res.status(404).send({ message: 'User Not found.' });
        return;
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password,
      );

      if (!passwordIsValid) {
        res.status(401).send({
          accessToken: null,
          message: 'Invalid Password!',
        });
        return;
      }

      const token = getAccessToken(user.id);
      getRefreshToken(user, req.fingerprint)
        .then((refreshToken) => {
          const authorities = [];

          for (let i = 0; i < user.roles.length; i++) {
            authorities.push(`ROLE_${user.roles[i].name.toUpperCase()}`);
          }

          res.cookie('refreshToken', refreshToken, cookiesOptions);
          res.status(200).send({
            email: user.email,
            nickname: user.nickname,
            roles: authorities,
            image: user.image,
            accessToken: token,
            expiryToken: config.expiryToken,
          });
        })
        .catch((error) => {
          // no es obj err de mongoose
          res.status(500).send({ message: error });
        });
    });
};

export const refreshTokenController = (req, res) => {
  const refreshToken =
    req.headers.cookie
      .split(';')
      .filter((c) => c.includes('refreshToken'))[0]
      .split('=')[1] || '';

  processRefreshToken(refreshToken, req.fingerprint)
    .then((tokens) => {
      res.cookie('refreshToken', tokens.refreshToken, cookiesOptions);
      return res.send({
        accessToken: tokens.accessToken,
        expiryToken: config.expiryToken,
      });
    })
    .catch((err) => {
      const message = err && err.message ? err.message : err;
      res.status(403).send({ message });
    });
};

export const resetPassword = (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log('Crypto error: ', err);
      return res.status(500).send({
        message: 'We couldnt process your request, please try again.',
      });
    }
    const token = buffer.toString('hex');

    User.findOne({
      email: req.body.email,
    })
      .populate('roles', '-__v')
      .exec(async (err, user) => {
        if (err) {
          console.log('Reset password mongoose/user error: ', err.message);
          res.status(500).send({ message: 'Internal server error' });
          return;
        }

        if (!user) {
          res.status(404).send({ message: 'User Email Not found.' });
          return;
          // main err handler
          // const err = new Error('User Email Not found');
          // err.status = 404;
          // return next(err);
        }

        user.resetPasswordToken = token;
        user.resetPasswordTokenExpiration = Date.now() + 3600000;

        user.save((err) => {
          if (err) {
            console.log('Reset password mongoose/user error: ', err.message);
            res.status(500).send({ message: 'Internal server error' });
            return;
          }

          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const hosting =
            process.env.NODE_ENV === 'production'
              ? `https://${process.env.SERVER_URL}`
              : `http://${process.env.SERVER_URL}`;
          const msg = {
            to: 'sebas.warsaw@gmail.com',
            from: 'contact@seva32.tk', // es el que registre en sendgrid, sino exception
            subject: 'Password reset on seva32.tk',
            text: 'and easy to do anywhere, even with Node.js',
            html: `
            <strong>You requested a password reset</strong>
            <strong>Click this <a href="${hosting}/reset-password/${token}/${req.body.email}">link</a> to set a new password.</strong>
          `,
          };
          sgMail
            .send(msg)
            .then((_m) => res.redirect('/'))
            .catch((e) => {
              console.log('Sendgrid Error: ', e.response.body.errors);
              return res.status(500).send({
                message: 'We couldnt process your request, try again later',
              });
            });
        });
      });
  });
};

export const changePassword = (req, res) => {
  const { newPassword, oldPassword, token, email } = req.body; // eslint-disable-line

  if (!newPassword || !oldPassword || !token || !email) {
    return res
      .status(401)
      .send({ message: "Imcomplete data, we couldn't reset your password" });
  }

  User.findOne({
    email,
    resetPasswordToken: token,
    resetPasswordTokenExpiration: { $gt: Date.now() },
  })
    .populate('roles', '-__v')
    .exec(async (err, user) => {
      if (err) {
        console.log('Change password mongoose/user error: ', err.message);
        res.status(500).send({ message: 'Internal server error' });
        return;
      }
      if (!user) {
        res
          .status(404)
          .send({ message: 'Invalid data trying to change your password.' });
        return;
      }

      const passwordIsValid = bcrypt.compareSync(oldPassword, user.password);

      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Your data didn't match, no change applied",
        });
      }

      user.password = bcrypt.hashSync(req.body.newPassword, 8);
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpiration = undefined;

      user.save((err) => {
        if (err) {
          console.log('Change password mongoose/user error: ', err.message);
          res.status(500).send({ message: 'Internal server error' });
          return;
        }

        return res
          .status(200)
          .send({ message: 'Password changed! Signin with your new password' });
      });
    });
};
