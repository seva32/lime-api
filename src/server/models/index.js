import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require('./user').default;
db.role = require('./role').default;
db.thirdPartyProviderSchema = require('./thirdPartyProviderSchema').default;
db.token = require('./token').default;
db.order = require('./order').default;
db.product = require('./product').default;

db.ROLES = ['user', 'admin', 'moderator'];

export default db;
