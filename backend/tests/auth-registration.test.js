const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/User');
const Notification = require('../models/Notification');
const authController = require('../controllers/authController');

test('public registration ignores a client-supplied admin role', async () => {
  const originalMethods = {
    findOne: User.findOne,
    create: User.create,
    find: User.find,
    insertMany: Notification.insertMany
  };
  const originalJwtSecret = process.env.JWT_SECRET;
  let createdUser;
  let cookieSet = false;

  try {
    process.env.JWT_SECRET = 'registration-test-secret';
    User.findOne = async () => null;
    User.create = async (data) => {
      createdUser = data;
      return { _id: 'test-user-id', ...data };
    };
    User.find = async () => [];
    Notification.insertMany = async () => {};

    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      cookie() {
        cookieSet = true;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      }
    };

    await authController.register({
      body: {
        firstName: 'Test',
        lastName: 'Registrant',
        email: 'registrant@example.test',
        password: 'test-password',
        role: 'admin'
      }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdUser.role, 'intern');
    assert.equal(createdUser.isApproved, false);
    assert.equal(createdUser.isActive, true);
    assert.equal(res.body.user.role, 'intern');
    assert.equal(res.body.user.isApproved, false);
    assert.equal(Object.hasOwn(res.body, 'token'), false);
    assert.equal(cookieSet, false);
  } finally {
    User.findOne = originalMethods.findOne;
    User.create = originalMethods.create;
    User.find = originalMethods.find;
    Notification.insertMany = originalMethods.insertMany;

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});
