const test = require('node:test');
const assert = require('node:assert/strict');

const Application = require('../models/Application');
const Intern = require('../models/Intern');
const Team = require('../models/Team');
const fs = require('node:fs');
const uploadsRouter = require('../routes/uploads');

const OWNER_ID = '111111111111111111111111';
const OTHER_ID = '222222222222222222222222';
const SUPERVISOR_ID = '333333333333333333333333';
const DOC_ID = '444444444444444444444444';
const APP_ID = '555555555555555555555555';
const PROFILE_ID = '666666666666666666666666';

function getRoute(method, routePath) {
  const layer = uploadsRouter.stack.find((item) =>
    item.route?.path === routePath && item.route.methods[method]
  );
  assert.ok(layer, `Expected ${method.toUpperCase()} ${routePath} route`);
  return layer.route.stack;
}

function makeResponse() {
  return {
    statusCode: 200,
    payload: null,
    downloadArgs: null,
    headersSent: false,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    set() { return this; },
    download(...args) { this.downloadArgs = args; return this; }
  };
}

async function callHandler(stack, user, params) {
  const handler = stack.at(-1).handle;
  const res = makeResponse();
  await handler({ user, params }, res);
  return res;
}

test('unauthenticated requests are rejected by the route authentication middleware', async () => {
  const auth = getRoute('get', '/documents/:documentId')[0].handle;
  const res = makeResponse();
  await auth({ cookies: {}, header: () => undefined }, res, () => assert.fail('next must not run'));
  assert.equal(res.statusCode, 401);
});

test('an intern cannot download another intern document', async () => {
  const originalFindOne = Intern.findOne;
  const originalExistsSync = fs.existsSync;
  Intern.findOne = async () => ({
    user: OWNER_ID,
    supervisor: SUPERVISOR_ID,
    documents: [{ _id: DOC_ID, url: '/uploads/private.pdf' }]
  });
  fs.existsSync = () => assert.fail('Unauthorized requests must not check/send files');
  try {
    const res = await callHandler(getRoute('get', '/documents/:documentId'), { _id: OTHER_ID, role: 'intern' }, { documentId: DOC_ID });
    assert.equal(res.statusCode, 403);
    assert.equal(res.downloadArgs, null);
  } finally {
    Intern.findOne = originalFindOne;
    fs.existsSync = originalExistsSync;
  }
});

test('a supervisor cannot download a document outside their assigned interns', async () => {
  const originalFindOne = Intern.findOne;
  const originalExistsSync = fs.existsSync;
  Intern.findOne = async () => ({
    user: OWNER_ID,
    supervisor: OTHER_ID,
    documents: [{ _id: DOC_ID, url: '/uploads/private.pdf' }]
  });
  fs.existsSync = () => assert.fail('Unauthorized requests must not check/send files');
  try {
    const res = await callHandler(getRoute('get', '/documents/:documentId'), { _id: SUPERVISOR_ID, role: 'supervisor' }, { documentId: DOC_ID });
    assert.equal(res.statusCode, 403);
    assert.equal(res.downloadArgs, null);
  } finally {
    Intern.findOne = originalFindOne;
    fs.existsSync = originalExistsSync;
  }
});

test('an intern can download their own document and an admin can download a CV', async () => {
  const originalInternFindOne = Intern.findOne;
  const originalApplicationFindById = Application.findById;
  const originalExistsSync = fs.existsSync;
  const originalRealpathSync = fs.realpathSync;
  Intern.findOne = async () => ({
    user: OWNER_ID,
    supervisor: SUPERVISOR_ID,
    documents: [{ _id: DOC_ID, url: '/uploads/private.pdf' }]
  });
  Application.findById = async () => ({ _id: APP_ID, user: OWNER_ID, cvUrl: '/uploads/cv.pdf' });
  fs.existsSync = () => true;
  fs.realpathSync = (filepath) => filepath;
  try {
    const ownDocument = await callHandler(getRoute('get', '/documents/:documentId'), { _id: OWNER_ID, role: 'intern' }, { documentId: DOC_ID });
    assert.equal(ownDocument.statusCode, 200);
    assert.ok(ownDocument.downloadArgs[0].endsWith('private.pdf'));

    const adminCv = await callHandler(getRoute('get', '/cv/:applicationId'), { _id: OTHER_ID, role: 'admin' }, { applicationId: APP_ID });
    assert.equal(adminCv.statusCode, 200);
    assert.ok(adminCv.downloadArgs[0].endsWith('cv.pdf'));
  } finally {
    Intern.findOne = originalInternFindOne;
    Application.findById = originalApplicationFindById;
    fs.existsSync = originalExistsSync;
    fs.realpathSync = originalRealpathSync;
  }
});

test('a supervisor can download a CV only when the applicant is assigned to them', async () => {
  const originalInternFindOne = Intern.findOne;
  const originalApplicationFindById = Application.findById;
  const originalExistsSync = fs.existsSync;
  const originalRealpathSync = fs.realpathSync;
  Application.findById = async () => ({ _id: APP_ID, user: OWNER_ID, cvUrl: '/uploads/cv.pdf' });
  Intern.findOne = async (query) => query.supervisor === SUPERVISOR_ID
    ? ({ user: OWNER_ID, supervisor: SUPERVISOR_ID })
    : null;
  fs.existsSync = () => true;
  fs.realpathSync = (filepath) => filepath;
  try {
    const res = await callHandler(getRoute('get', '/cv/:applicationId'), { _id: SUPERVISOR_ID, role: 'supervisor' }, { applicationId: APP_ID });
    assert.equal(res.statusCode, 200);
    assert.ok(res.downloadArgs[0].endsWith('cv.pdf'));

    Intern.findOne = async () => null;
    const outsideScope = await callHandler(getRoute('get', '/cv/:applicationId'), { _id: SUPERVISOR_ID, role: 'supervisor' }, { applicationId: APP_ID });
    assert.equal(outsideScope.statusCode, 403);
  } finally {
    Intern.findOne = originalInternFindOne;
    Application.findById = originalApplicationFindById;
    fs.existsSync = originalExistsSync;
    fs.realpathSync = originalRealpathSync;
  }
});

test('a supervisor can download a CV for an intern assigned through their team', async () => {
  const originalInternFindOne = Intern.findOne;
  const originalInternFind = Intern.find;
  const originalTeamFind = Team.find;
  const originalApplicationFindById = Application.findById;
  const originalExistsSync = fs.existsSync;
  const originalRealpathSync = fs.realpathSync;
  Application.findById = async () => ({ _id: APP_ID, user: OWNER_ID, cvUrl: '/uploads/cv.pdf' });
  Intern.findOne = async (query) => query.user === OWNER_ID
    ? ({ _id: PROFILE_ID, user: OWNER_ID, supervisor: OTHER_ID })
    : null;
  Team.find = () => ({
    select() { return this; },
    lean: async () => [{ interns: [PROFILE_ID] }]
  });
  Intern.find = () => ({
    select() { return this; },
    lean: async () => [{ user: OWNER_ID }]
  });
  fs.existsSync = () => true;
  fs.realpathSync = (filepath) => filepath;
  try {
    const res = await callHandler(getRoute('get', '/cv/:applicationId'), { _id: SUPERVISOR_ID, role: 'supervisor' }, { applicationId: APP_ID });
    assert.equal(res.statusCode, 200);
    assert.ok(res.downloadArgs[0].endsWith('cv.pdf'));
  } finally {
    Intern.findOne = originalInternFindOne;
    Intern.find = originalInternFind;
    Team.find = originalTeamFind;
    Application.findById = originalApplicationFindById;
    fs.existsSync = originalExistsSync;
    fs.realpathSync = originalRealpathSync;
  }
});

test('missing files return 404 and path traversal inputs are rejected', async () => {
  const originalInternFindOne = Intern.findOne;
  const originalExistsSync = fs.existsSync;
  const intern = {
    user: OWNER_ID,
    documents: [{ _id: DOC_ID, url: '/uploads/missing.pdf' }]
  };
  Intern.findOne = async () => intern;
  fs.existsSync = () => false;
  try {
    const missing = await callHandler(getRoute('get', '/documents/:documentId'), { _id: OWNER_ID, role: 'intern' }, { documentId: DOC_ID });
    assert.equal(missing.statusCode, 404);

    intern.documents[0].url = '/uploads/../../outside.pdf';
    fs.existsSync = () => true;
    const storedTraversal = await callHandler(getRoute('get', '/documents/:documentId'), { _id: OWNER_ID, role: 'intern' }, { documentId: DOC_ID });
    assert.equal(storedTraversal.statusCode, 404);

    const traversal = await callHandler(getRoute('get', '/documents/:documentId'), { _id: OWNER_ID, role: 'intern' }, { documentId: '../../outside.pdf' });
    assert.equal(traversal.statusCode, 400);
  } finally {
    Intern.findOne = originalInternFindOne;
    fs.existsSync = originalExistsSync;
  }
});
