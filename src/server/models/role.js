import mongoose from 'mongoose';

const { Schema } = mongoose;
mongoose.set('useCreateIndex', true);

const roleSchema = new Schema({
  name: {
    type: String,
    default: null,
  },
});

const ModelClass = mongoose.model('role', roleSchema);

export default ModelClass;

// import mongoose from 'mongoose';

// const RoleSchema = mongoose.model(
//   'RoleSchema',
//   new mongoose.Schema({
//     name: {
//       type: String,
//       default: null,
//     },
//   }),
// );

// export default RoleSchema;
