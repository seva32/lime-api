/* eslint-disable consistent-return */
/* eslint-disable func-names */
import mongoose from 'mongoose';

const { Schema } = mongoose;

// define model
const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      dropDups: true,
    },
    email_is_verified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
    nickname: {
      type: String,
    },
    image: {
      type: String,
    },
    referral_code: {
      type: String,
      default() {
        let hash = 0;
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < this.email.length; i++) {
          hash = this.email.charCodeAt(i) + ((hash << 5) - hash); // eslint-disable-line
        }
        const res = (hash & 0x00ffffff).toString(16).toUpperCase(); // eslint-disable-line
        return '00000'.substring(0, 6 - res.length) + res;
      },
    },
    roles: [
      {
        ref: 'role',
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    third_party_auth: [
      {
        ref: 'thirdPartyProvider',
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordTokenExpiration: Date,
    token: [
      {
        ref: 'token',
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { strict: false }, // aceptar datos que aun no estan en el schema
);
// on save hook ecrypt pass
// userSchema.pre('save', function (next) {
//   const user = this;
//   bcrypt.hash(user.password, 10, (err, hash) => {
//     if (err) {
//       return next(err);
//     }
//     user.password = hash;
//     next();
//   });
// });

// crear un method para comparar pass
// userSchema.methods.comparePassword = function (candidatePass, cb) {
// if candidatePass type is number error
//   bcrypt.compare(candidatePass.toString(), this.password, (err, isMatch) => {
//     if (err) {
//       return cb(err);
//     }
//     cb(null, isMatch);
//   });
// };

// create model class
const ModelClass = mongoose.model('user', userSchema);

// export model
export default ModelClass;

// After initializing Mongoose, we don’t need to
// write CRUD functions because Mongoose supports all of them:

// create a new User: object.save()
// find a User by id: User.findById(id)
// find User by email: User.findOne({ email: … })
// find User by username: User.findOne({ username: … })
// find all Roles which name in given roles array: Role.find({ name: { $in: roles } })
// These functions will be used in our Controllers and Middlewares.

// SchemaName.findById(_id, function (e, data) {
//   if (e) console.log(e);
//   data.sub1.id(_id1).sub2.id(_id2).field = req.body.something;

//   // or if you want to change more then one field -
//   //=> var t = data.sub1.id(_id1).sub2.id(_id2);
//   //=> t.field = req.body.something;

//   data.save();
// });

// const { ObjectId } = require('mongoose').Types;
// const objId = new ObjectId(payload);
