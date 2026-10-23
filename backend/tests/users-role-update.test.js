const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/User');
const Intern = require('../models/Intern');
const usersRouter = require('../routes/users');

const targetUserId = '64b000000000000000000001';
const callerUserId = '64b000000000000000000002';

function getRouteHandler(method, routePath) {
  const layer = usersRouter.stack.find((item) =>
    item.route?.path === routePath && item.route.methods[method]
  );
  assert.ok(layer, `Expected ${method.toUpperCase()} ${routePath} route`);
  return layer.route.stack.at(-1).handle;
}

function makeUser(role = 'intern', overrides = {}) {
  return {
    _id: targetUserId,
    role,
    firstName: 'Before',
    lastName: 'Name',
    email: 'before@example.test',
    phone: '000',
    isApproved: true,
    isActive: true,
    pageAccess: 'all',
    allowedPages: [],
    password: 'unchanged-hash',
    saved: false,
    async save() {
      this.saved = true;
    },
    ...overrides
  };
}

async function invoke(handler, user, params, body) {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  await handler({ user, params, body }, res);
  return res;
}

test('intern cannot change role or account controls through profile update', async () => {
  const target = makeUser('intern');
  const originalFindById = User.findById;
  User.findById = async () => target;
  try {
    const res = await invoke(getRouteHandler('put', '/:id'), { id: targetUserId, role: 'intern' }, { id: targetUserId }, {
      role: 'admin', isApproved: true, isActive: false, firstName: 'Changed'
    });

    assert.equal(res.statusCode, 400);
    assert.equal(target.role, 'intern');
    assert.equal(target.isApproved, true);
    assert.equal(target.isActive, true);
    assert.equal(target.firstName, 'Before');
    assert.equal(target.saved, false);
  } finally {
    User.findById = originalFindById;
  }
});

test('supervisor cannot promote themselves through profile update', async () => {
  const target = makeUser('supervisor');
  const originalFindById = User.findById;
  User.findById = async () => target;
  try {
    const res = await invoke(getRouteHandler('put', '/:id'), { id: targetUserId, role: 'supervisor' }, { id: targetUserId }, {
      role: 'admin'
    });

    assert.equal(res.statusCode, 400);
    assert.equal(target.role, 'supervisor');
    assert.equal(target.saved, false);
  } finally {
    User.findById = originalFindById;
  }
});

test('a user cannot change another user\'s role through profile update', async () => {
  const originalFindById = User.findById;
  User.findById = async () => {
    throw new Error('The target must not be loaded');
  };
  try {
    const res = await invoke(getRouteHandler('put', '/:id'), { id: callerUserId, role: 'intern' }, { id: targetUserId }, {
      role: 'admin'
    });

    assert.equal(res.statusCode, 403);
  } finally {
    User.findById = originalFindById;
  }
});

test('a non-admin cannot use the dedicated role endpoint', async () => {
  const originalFindById = User.findById;
  User.findById = async () => {
    throw new Error('The target must not be loaded');
  };
  try {
    const res = await invoke(getRouteHandler('patch', '/:id/role'), { id: callerUserId, role: 'supervisor' }, { id: targetUserId }, {
      role: 'admin'
    });

    assert.equal(res.statusCode, 403);
  } finally {
    User.findById = originalFindById;
  }
});

test('intern and supervisor profile fields remain self-service', async () => {
  const originalFindById = User.findById;
  try {
    for (const role of ['intern', 'supervisor']) {
      const target = makeUser(role);
      User.findById = async () => target;
      const res = await invoke(getRouteHandler('put', '/:id'), { id: targetUserId, role }, { id: targetUserId }, {
        firstName: 'Updated', email: 'updated@example.test', phone: '123', address: 'ignored'
      });

      assert.equal(res.statusCode, 200);
      assert.equal(target.firstName, 'Updated');
      assert.equal(target.email, 'updated@example.test');
      assert.equal(target.phone, '123');
      assert.equal(target.address, undefined);
      assert.equal(target.role, role);
      assert.equal(target.saved, true);
    }
  } finally {
    User.findById = originalFindById;
  }
});

test('an authenticated administrator can change a role through the dedicated endpoint', async () => {
  const target = makeUser('intern', { pageAccess: 'custom', allowedPages: ['dashboard'] });
  const originalFindById = User.findById;
  const originalFindOneAndDelete = Intern.findOneAndDelete;
  let removedInternProfile = false;
  User.findById = async () => target;
  Intern.findOneAndDelete = async () => {
    removedInternProfile = true;
  };
  try {
    const res = await invoke(getRouteHandler('patch', '/:id/role'), { id: callerUserId, role: 'admin' }, { id: targetUserId }, {
      role: 'supervisor'
    });

    assert.equal(res.statusCode, 200);
    assert.equal(target.role, 'supervisor');
    assert.deepEqual(target.allowedPages, ['dashboard']);
    assert.equal(target.saved, true);
    assert.equal(removedInternProfile, true);
  } finally {
    User.findById = originalFindById;
    Intern.findOneAndDelete = originalFindOneAndDelete;
  }
});

test('an administrator can update another user and invalidate sessions when resetting the password', async () => {
  const target = makeUser('intern');
  const originalFindById = User.findById;
  User.findById = async () => target;
  try {
    const res = await invoke(getRouteHandler('put', '/:id'), { id: callerUserId, role: 'admin' }, { id: targetUserId }, {
      firstName: 'Updated',
      email: 'updated@example.test',
      password: 'new-pass-123'
    });

    assert.equal(res.statusCode, 200);
    assert.equal(target.firstName, 'Updated');
    assert.equal(target.email, 'updated@example.test');
    assert.equal(target.password, 'new-pass-123');
    assert.equal(target.tokenVersion, 1);
    assert.equal(target.saved, true);
  } finally {
    User.findById = originalFindById;
  }
});

test('an administrator cannot set a password shorter than six characters', async () => {
  const originalFindById = User.findById;
  User.findById = async () => {
    throw new Error('The target must not be loaded');
  };
  try {
    const res = await invoke(getRouteHandler('put', '/:id'), { id: callerUserId, role: 'admin' }, { id: targetUserId }, {
      password: 'short'
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /6 et 128 caractères/);
  } finally {
    User.findById = originalFindById;
  }
});
