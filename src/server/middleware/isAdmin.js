import db from '../models';

const User = db.user;

// eslint-disable-next-line consistent-return
const isAdmin = (req, res, next) => {
  // profile img dont need admin role
  if (req.originalUrl.includes('profile')) {
    return next();
  }

  if (!req.accessTokenUserId) {
    return res.status(401).send({ message: 'Unauthorized (token).' });
  }

  User.findOne({
    _id: req.accessTokenUserId,
  })
    .populate('roles', '-__v')
    .exec((err, user) => {
      if (err) {
        console.log('Error on isAdminMiddeware mongoose: ', err.message);
        return res.status(500).send({ message: 'Internal server error' });
      }

      if (!user) {
        return res.status(400).send({
          message: 'Unauthorized',
        });
      }

      const isAdm = user.roles.find((r) => r.name === 'admin');

      if (!isAdm) {
        return res.status(400).send({
          message: 'You are not authorized to perform this action.',
        });
      }

      // user is admin
      return next();
    });
};

export default isAdmin;
