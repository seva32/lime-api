import db from '../models';

const { ROLES } = db;
const User = db.user;

export const checkDuplicateEmail = (req, res, next) => {
  User.findOne({
    email: req.body.email,
  }).exec((err, user) => {
    if (err) {
      console.log('Error on checkDuplicateEmail mongoose: ', err.message);
      res.status(500).send({ message: 'Internal server error' });
      return;
    }

    if (user) {
      res.status(400).send({ message: 'Failed! Email is already in use!' });
      return;
    }

    next();
  });
};

export const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
        return;
      }
    }
  }

  next();
};

export const checkThirdPartyProvider = (req, res, next) => {
  User.findOne({
    email: req.body.email,
  }).exec((err, user) => {
    if (err) {
      console.log('Error on checkThirdPartyProvider mongoose: ', err.message);
      res.status(500).send({ message: 'Internal server error' });
      return;
    }

    if (!user) {
      res.status(400).send({
        message: 'Invalid email',
      });
      return;
    }

    if (user.third_party_auth.length) {
      res.status(400).send({
        message:
          'You cannot change the password, you created this profile with your Google account data',
      });
      return;
    }

    next();
  });
};
