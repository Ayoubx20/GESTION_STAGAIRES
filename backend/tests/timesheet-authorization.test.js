const test = require('node:test');
const assert = require('node:assert/strict');

const Timesheet = require('../models/Timesheet');
const Team = require('../models/Team');
const Intern = require('../models/Intern');
const router = require('../routes/timesheet');

const SUPERVISOR_ID = '111111111111111111111111';
const OWNER_ID = '222222222222222222222222';
const OUTSIDE_ID = '333333333333333333333333';
const PROFILE_ID = '444444444444444444444444';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function handler(method, routePath) {
  const route = router.stack.find((layer) => layer.route?.path === routePath && layer.route.methods[method]);
  assert.ok(route, `Expected ${method.toUpperCase()} ${routePath}`);
  return route.route.stack.at(-1).handle;
}

function scopedInternQueries() {
  Team.find = () => ({ select() { return this; }, lean: async () => [{ interns: [PROFILE_ID] }] });
  Intern.find = () => ({ select() { return this; }, lean: async () => [{ user: OWNER_ID }] });
}

test('supervisor all-timesheets query is restricted to direct and team scope', async () => {
  const originalTeamFind = Team.find;
  const originalInternFind = Intern.find;
  const originalTimesheetFind = Timesheet.find;
  let receivedQuery;
  scopedInternQueries();
  Timesheet.find = (query) => {
    receivedQuery = query;
    return { populate() { return this; }, lean: async () => [] };
  };
  try {
    const res = response();
    await handler('get', '/admin/all')({ user: { id: SUPERVISOR_ID, role: 'supervisor' } }, res);
    assert.deepEqual(receivedQuery, { user: { $in: [OWNER_ID] } });
    assert.equal(res.statusCode, 200);
  } finally {
    Team.find = originalTeamFind;
    Intern.find = originalInternFind;
    Timesheet.find = originalTimesheetFind;
  }
});

test('supervisor cannot retrieve a timesheet outside their scope', async () => {
  const originalTeamFind = Team.find;
  const originalInternFind = Intern.find;
  const originalTimesheetFindOne = Timesheet.findOne;
  scopedInternQueries();
  Timesheet.findOne = () => assert.fail('Out-of-scope timesheets must not be queried');
  try {
    const res = response();
    await handler('get', '/admin/:userId')({ user: { id: SUPERVISOR_ID, role: 'supervisor' }, params: { userId: OUTSIDE_ID } }, res);
    assert.equal(res.statusCode, 403);
  } finally {
    Team.find = originalTeamFind;
    Intern.find = originalInternFind;
    Timesheet.findOne = originalTimesheetFindOne;
  }
});

test('administrator retains all-timesheet access', async () => {
  const originalTimesheetFind = Timesheet.find;
  let receivedQuery;
  Timesheet.find = (query) => {
    receivedQuery = query;
    return { populate() { return this; }, lean: async () => [] };
  };
  try {
    const res = response();
    await handler('get', '/admin/all')({ user: { id: OUTSIDE_ID, role: 'admin' } }, res);
    assert.deepEqual(receivedQuery, {});
    assert.equal(res.statusCode, 200);
  } finally {
    Timesheet.find = originalTimesheetFind;
  }
});
