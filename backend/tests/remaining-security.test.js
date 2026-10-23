const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Intern = require('../models/Intern');
const Team = require('../models/Team');
const Evaluation = require('../models/Evaluation');
const Settings = require('../models/Settings');
const UserSettings = require('../models/UserSettings');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');
const internsRouter = require('../routes/interns');
const evaluationsRouter = require('../routes/evaluations');
const settingsRouter = require('../routes/settings');
const authRouter = require('../routes/auth');
const { createTrustedOrigins, isAllowedOrigin } = require('../utils/originPolicy');

const INTERN_ID = '111111111111111111111111';
const SUPERVISOR_ID = '222222222222222222222222';
const OTHER_ID = '333333333333333333333333';
const PROFILE_ID = '444444444444444444444444';

function response() {
  return {
    statusCode: 200,
    body: null,
    cleared: false,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    clearCookie() { this.cleared = true; return this; }
  };
}

function endpoint(router, method, routePath) {
  const route = router.stack.find((layer) => layer.route?.path === routePath && layer.route.methods[method]);
  assert.ok(route, `Expected ${method.toUpperCase()} ${routePath}`);
  return route.route.stack.at(-1).handle;
}

function queryResult(value) {
  return {
    select() { return this; },
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); }
  };
}

test('authentication middleware rejects an unapproved intern and clears the cookie', async () => {
  const originalVerify = jwt.verify;
  const originalFindById = User.findById;
  jwt.verify = () => ({ id: INTERN_ID, tokenVersion: 0 });
  User.findById = () => ({ select: async () => ({ _id: INTERN_ID, role: 'intern', isActive: true, isApproved: false, tokenVersion: 0 }) });
  const res = response();
  try {
    await auth({ cookies: { token: 'dummy' }, header: () => undefined }, res, () => assert.fail('next must not run'));
    assert.equal(res.statusCode, 403);
    assert.equal(res.cleared, true);
  } finally {
    jwt.verify = originalVerify;
    User.findById = originalFindById;
  }
});

test('authentication middleware revokes an old token after account tokenVersion changes', async () => {
  const originalVerify = jwt.verify;
  const originalFindById = User.findById;
  jwt.verify = () => ({ id: SUPERVISOR_ID, tokenVersion: 0 });
  User.findById = () => ({ select: async () => ({ _id: SUPERVISOR_ID, role: 'supervisor', isActive: true, isApproved: true, tokenVersion: 1 }) });
  const res = response();
  try {
    await auth({ cookies: { token: 'dummy' }, header: () => undefined }, res, () => assert.fail('next must not run'));
    assert.equal(res.statusCode, 401);
    assert.equal(res.cleared, true);
  } finally {
    jwt.verify = originalVerify;
    User.findById = originalFindById;
  }
});

test('intern profile update rejects privileged mass assignment', async () => {
  const originalFindById = Intern.findById;
  Intern.findById = async () => ({ _id: PROFILE_ID, user: INTERN_ID, supervisor: SUPERVISOR_ID });
  try {
    const res = response();
    await endpoint(internsRouter, 'put', '/:id')({
      user: { id: INTERN_ID, role: 'intern' },
      params: { id: PROFILE_ID },
      body: { status: 'active', supervisor: OTHER_ID }
    }, res);
    assert.equal(res.statusCode, 400);
  } finally {
    Intern.findById = originalFindById;
  }
});

test('an intern can update an explicitly allowed field on their own profile', async () => {
  const originalFindById = Intern.findById;
  const profile = {
    _id: PROFILE_ID,
    user: INTERN_ID,
    address: {},
    async save() { this.saved = true; },
    async populate() { return this; }
  };
  Intern.findById = async () => profile;
  try {
    const res = response();
    await endpoint(internsRouter, 'put', '/:id')({
      user: { id: INTERN_ID, role: 'intern' },
      params: { id: PROFILE_ID },
      body: { address: { city: 'Rabat' } }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(profile.address.city, 'Rabat');
    assert.equal(profile.saved, true);
  } finally {
    Intern.findById = originalFindById;
  }
});

test('an intern cannot create an approved account through intern management', async () => {
  const originalFindOne = User.findOne;
  User.findOne = () => assert.fail('An intern must be denied before account lookup');
  try {
    const res = response();
    await endpoint(internsRouter, 'post', '/')({ user: { id: INTERN_ID, role: 'intern' }, body: {} }, res);
    assert.equal(res.statusCode, 403);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('a supervisor cannot read an intern outside their assigned scope', async () => {
  const originals = { findById: Intern.findById, exists: Team.exists };
  Intern.findById = () => queryResult({ _id: PROFILE_ID, user: INTERN_ID, supervisor: OTHER_ID });
  Team.exists = async () => null;
  try {
    const res = response();
    await endpoint(internsRouter, 'get', '/:id')({
      user: { id: SUPERVISOR_ID, role: 'supervisor' }, params: { id: PROFILE_ID }
    }, res);
    assert.equal(res.statusCode, 403);
  } finally {
    Intern.findById = originals.findById;
    Team.exists = originals.exists;
  }
});

test('a supervisor cannot read evaluations for an unrelated intern', async () => {
  const originals = { findById: Intern.findById, exists: Team.exists, find: Evaluation.find };
  Intern.findById = async () => ({ _id: PROFILE_ID, user: INTERN_ID, supervisor: OTHER_ID });
  Team.exists = async () => null;
  Evaluation.find = () => assert.fail('Unauthorized evaluation query must not run');
  try {
    const res = response();
    await endpoint(evaluationsRouter, 'get', '/intern/:internId')({
      user: { id: SUPERVISOR_ID, role: 'supervisor' }, params: { internId: PROFILE_ID }
    }, res);
    assert.equal(res.statusCode, 403);
  } finally {
    Intern.findById = originals.findById;
    Team.exists = originals.exists;
    Evaluation.find = originals.find;
  }
});

test('settings responses redact SMTP credentials', async () => {
  const originals = { global: Settings.findOne, personal: UserSettings.findOne };
  Settings.findOne = () => ({ select: async () => ({ toObject: () => ({ _id: 'global', companyName: 'Test', smtpUsername: 'mailbox@example.test', smtpPassword: 'withheld-test-value' }) }) });
  UserSettings.findOne = async () => ({ _id: 'personal', toObject: () => ({ language: 'fr' }) });
  try {
    const res = response();
    await endpoint(settingsRouter, 'get', '/')({ user: { id: INTERN_ID, role: 'intern' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Object.hasOwn(res.body.settings, 'smtpPassword'), false);
    assert.equal(Object.hasOwn(res.body.settings, 'smtpUsername'), false);
    assert.equal(res.body.settings.smtpPasswordConfigured, true);
  } finally {
    Settings.findOne = originals.global;
    UserSettings.findOne = originals.personal;
  }
});

test('production CORS accepts exact origins and rejects wildcard/prefix lookalikes', () => {
  const trusted = createTrustedOrigins(['https://app.example.test'], true);
  assert.equal(isAllowedOrigin('https://app.example.test', trusted, true), true);
  assert.equal(isAllowedOrigin('https://app.example.test.attacker.test', trusted, true), false);
  assert.equal(isAllowedOrigin('https://attacker.vercel.app', trusted, true), false);
  assert.equal(isAllowedOrigin('https://app.example.test/path', trusted, true), false);
});

test('password reset endpoints have request and attempt rate limiters', () => {
  for (const [path, limiterCount] of [['/forgot-password', 1], ['/verify-reset-code', 1], ['/reset-password', 1]]) {
    const route = authRouter.stack.find((layer) => layer.route?.path === path);
    assert.ok(route, `Expected ${path}`);
    assert.ok(route.route.stack.length >= limiterCount + 2, `${path} must include rate limiting and validation middleware`);
  }
});

test('successful password reset atomically consumes the code and revokes existing sessions', async () => {
  const originals = { findOne: User.findOne, findOneAndUpdate: User.findOneAndUpdate };
  let claimQuery;
  let claimUpdate;
  let saved = false;
  User.findOne = () => ({ select: async () => ({ _id: INTERN_ID }) });
  User.findOneAndUpdate = (query, update) => {
    claimQuery = query;
    claimUpdate = update;
    return Promise.resolve({ password: null, save: async function save() { saved = this.password === 'new-password'; } });
  };
  try {
    const res = response();
    await authController.resetPassword({ body: { email: 'intern@example.test', code: '123456', password: 'new-password' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(claimQuery._id, INTERN_ID);
    assert.ok(claimQuery.resetPasswordExpires.$gt > 0);
    assert.equal(claimUpdate.$unset.resetPasswordToken, 1);
    assert.equal(claimUpdate.$inc.tokenVersion, 1);
    assert.equal(saved, true);
  } finally {
    User.findOne = originals.findOne;
    User.findOneAndUpdate = originals.findOneAndUpdate;
  }
});
