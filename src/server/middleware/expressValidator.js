/* eslint-disable no-useless-escape */
import { body, validationResult } from 'express-validator';

const regexInvalidChars = (value) => {
  const re = /(\{|\}|'|"|\\|;|<|>|&)/g;
  const invalidChars = [...value.matchAll(re)];
  if (invalidChars.length) {
    const invalidCharsMessage = [];
    invalidChars.forEach((i) => invalidCharsMessage.push(i[0]));
    throw new Error(`Invalid character/s: ${invalidCharsMessage.join('')}`);
  }
  return true;
};

const authValidationRules = () => [
  body('email')
    .not()
    .isEmpty()
    .withMessage('Email cannot be empty')
    .bail()
    .custom((email) => {
      // eslint-disable-next-line max-len
      const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!re.test(email)) {
        throw new Error('Email format is not valid, choose another one');
      }
      return true;
    })
    .isEmail(),
  body('password')
    .if((_value, { req }) => req.body.password) // para el controller que no usa password
    .custom(regexInvalidChars)
    .isLength({ min: 5 })
    .withMessage('Must be at least 5 chars long')
    .matches(/\d/)
    .withMessage('Must contain a number')
    .not()
    .isIn(['123', 'password', 'abc']),
  body(['oldPassword', 'newPassword'])
    .if((_value, { req }) => req.body.newPassword && req.body.oldPassword)
    .custom(regexInvalidChars)
    .isLength({ min: 5 })
    .withMessage('Must be at least 5 chars long')
    .matches(/\d/)
    .withMessage('Must contain a number')
    .not()
    .isIn(['123', 'password', 'abc']),
  body('token')
    .if((_value, { req }) => req.body.token)
    .isHexadecimal()
    .isLength({ min: 64, max: 64 }),
  body('nickname')
    .if((_value, { req }) => req.body.nickname)
    .custom(regexInvalidChars),
];

const profileValidationRules = () => [
  body('profile.email')
    .if((_value, { req }) => req.body.profile.email)
    .isEmail(),
  body('profile.familyName')
    .if((_value, { req }) => req.body.profile.familyName)
    .custom(regexInvalidChars),
  body('profile.givenName')
    .if((_value, { req }) => req.body.profile.givenName)
    .custom(regexInvalidChars),
  body('profile.imageUrl')
    .if((_value, { req }) => req.body.profile.imageUrl)
    .custom(regexInvalidChars)
    .isURL(),
  body('profile.provider')
    .if((_value, { req }) => req.body.profile.provider)
    .custom(regexInvalidChars),
  body('profile.id')
    .if((_value, { req }) => req.body.profile.id)
    .custom(regexInvalidChars),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors
    .array()
    .map((err) => extractedErrors.push(`In ${[err.param]}: ${err.msg}. `));

  return res.status(422).send({ message: extractedErrors.join('') });
};

export default {
  authValidationRules,
  profileValidationRules,
  validate,
};

// const { body } = require('express-validator');
// async validation, create promise to reject
// app.post(
//   '/user',
//   body('email').custom((value) => {
//     return User.findUserByEmail(value).then((user) => {
//       if (user) {
//         return Promise.reject('E-mail already in use');
//       }
//     });
//   }),
//   (req, res) => {
//     // Handle the request
//   },
// );

// validate params
// server.use('/param/:id', [validateParam(), validator.validate], (_req, res) => {
//   res.status(200).send({ message: 'ok' });
// });
// export const validateParam = () =>
//   // eslint-disable-next-line implicit-arrow-linebreak
//   checkSchema({
//     id: {
//       // The location of the field, can be one or
//          more of body, cookies, headers, params or query.
//       // If omitted, all request locations will be checked
//       in: ['params', 'query'],
//       errorMessage: 'ID is wrong',
//       isInt: true,
//       // Sanitizers can go here as well
//       toInt: true,
//     },
//   });
