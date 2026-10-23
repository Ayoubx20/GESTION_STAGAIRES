const test = require('node:test');
const assert = require('node:assert/strict');
const Task = require('../models/Task');
const Intern = require('../models/Intern');
const Team = require('../models/Team');
const User = require('../models/User');
const tasksRouter = require('../routes/tasks');

const INTERN_USER = '111111111111111111111111';
const OTHER_USER = '222222222222222222222222';
const SUPERVISOR = '333333333333333333333333';
const OTHER_SUPERVISOR = '444444444444444444444444';
const TASK_ID = '555555555555555555555555';
const INTERN_PROFILE = '666666666666666666666666';
const TEAM_USER = '777777777777777777777777';

function handler(method, routePath) {
  const layer = tasksRouter.stack.find((item) => item.route?.path === routePath && item.route.methods[method]);
  assert.ok(layer, `Expected ${method.toUpperCase()} ${routePath}`);
  return layer.route.stack.at(-1).handle;
}

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

async function invoke(fn, user, { id = TASK_ID, body = {}, query = {} } = {}) {
  const res = response();
  await fn({ user: { id: user._id, role: user.role }, params: { id }, body, query }, res);
  return res;
}

function chain(value) {
  return { select() { return this; }, lean: async () => value };
}

function populatedTask(task) {
  const query = {
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(task).then(resolve, reject); }
  };
  return query;
}

test('interns cannot read or change another intern task', async () => {
  const originalFindById = Task.findById;
  const task = { assignedTo: OTHER_USER, status: 'in_progress', progress: 20, save: async () => assert.fail('Cross-intern task must not be saved') };
  let findCalls = 0;
  Task.findById = () => findCalls++ === 0 ? populatedTask(task) : Promise.resolve(task);
  try {
    const read = await invoke(handler('get', '/:id'), { _id: INTERN_USER, role: 'intern' });
    assert.equal(read.statusCode, 403);
    const update = await invoke(handler('patch', '/:id/status'), { _id: INTERN_USER, role: 'intern' }, { body: { status: 'completed' } });
    assert.equal(update.statusCode, 403);
    assert.equal(task.status, 'in_progress');
  } finally {
    Task.findById = originalFindById;
  }
});

test('supervisors can access tasks for their own interns and team members, but not others', async () => {
  const originals = { task: Task.findById, team: Team.find, interns: Intern.find };
  const ownTask = { assignedTo: INTERN_USER, status: 'pending', progress: 0, save: async () => {} };
  const teamTask = { assignedTo: TEAM_USER, status: 'pending', progress: 0, save: async () => {} };
  const outsideTask = { assignedTo: OTHER_USER, status: 'pending', progress: 0, save: async () => assert.fail('Out-of-scope task must not be saved') };
  Task.findById = (id) => id === TASK_ID ? populatedTask(ownTask) : id === TEAM_USER ? populatedTask(teamTask) : outsideTask;
  Team.find = () => chain([{ interns: [INTERN_PROFILE] }]);
  Intern.find = (query) => chain(query.$or.some((item) => item.supervisor === SUPERVISOR)
    ? [{ user: INTERN_USER }, { user: TEAM_USER }]
    : []);
  try {
    const allowed = await invoke(handler('get', '/:id'), { _id: SUPERVISOR, role: 'supervisor' });
    assert.equal(allowed.statusCode, 200);
    const teamAllowed = await invoke(handler('get', '/:id'), { _id: SUPERVISOR, role: 'supervisor' }, { id: TEAM_USER });
    assert.equal(teamAllowed.statusCode, 200);

    const denied = await invoke(handler('patch', '/:id/status'), { _id: SUPERVISOR, role: 'supervisor' }, { id: OTHER_USER, body: { status: 'completed' } });
    assert.equal(denied.statusCode, 403);
  } finally {
    Task.findById = originals.task;
    Team.find = originals.team;
    Intern.find = originals.interns;
  }
});

test('task list search filters remain intersected with the supervisor ownership filter', async () => {
  const originals = { count: Task.countDocuments, find: Task.find, team: Team.find, interns: Intern.find };
  let capturedQuery;
  Task.countDocuments = async (query) => { capturedQuery = query; return 0; };
  Task.find = () => ({
    populate() { return this; }, sort() { return this; }, limit() { return this; }, skip() { return this; }, exec: async () => []
  });
  Team.find = () => chain([]);
  Intern.find = () => chain([{ user: INTERN_USER }]);
  try {
    const res = await invoke(handler('get', '/'), { _id: SUPERVISOR, role: 'supervisor' }, { query: { search: 'design' } });
    assert.equal(res.statusCode, 200);
    assert.ok(capturedQuery.$and.some((filter) => filter.assignedTo?.$in?.includes(INTERN_USER)));
    assert.ok(capturedQuery.$and.some((filter) => Array.isArray(filter.$or)));
  } finally {
    Task.countDocuments = originals.count;
    Task.find = originals.find;
    Team.find = originals.team;
    Intern.find = originals.interns;
  }
});

test('administrators can access all tasks and task creation ignores privileged client fields', async () => {
  const originalFindById = Task.findById;
  const originalFindOne = Intern.findOne;
  const originalUserFindById = User.findById;
  const originalCreate = Task.create;
  const task = { assignedTo: OTHER_USER };
  let created;
  Task.findById = () => populatedTask(task);
  Intern.findOne = () => chain({ _id: INTERN_PROFILE, user: OTHER_USER });
  User.findById = () => chain({ role: 'intern', isActive: true, isApproved: true });
  Task.create = async (value) => { created = value; return value; };
  try {
    const read = await invoke(handler('get', '/:id'), { _id: OTHER_SUPERVISOR, role: 'admin' });
    assert.equal(read.statusCode, 200);

    const create = await invoke(handler('post', '/'), { _id: OTHER_SUPERVISOR, role: 'admin' }, {
      body: {
        title: 'Task', description: 'Description', assignedTo: OTHER_USER,
        assignedBy: OTHER_USER, status: 'completed', progress: 100, comments: [{ text: 'forged' }]
      }
    });
    assert.equal(create.statusCode, 201);
    assert.equal(String(created.assignedBy), OTHER_SUPERVISOR);
    assert.equal(created.status, 'pending');
    assert.equal(created.progress, 0);
    assert.equal(created.comments, undefined);

    let deleted = false;
    Task.findById = async () => ({ deleteOne: async () => { deleted = true; } });
    const remove = await invoke(handler('delete', '/:id'), { _id: OTHER_SUPERVISOR, role: 'admin' });
    assert.equal(remove.statusCode, 200);
    assert.equal(deleted, true);
  } finally {
    Task.findById = originalFindById;
    Intern.findOne = originalFindOne;
    User.findById = originalUserFindById;
    Task.create = originalCreate;
  }
});

test('task updates ignore client supplied status, ownership, and comment fields', async () => {
  const originalFindById = Task.findById;
  const originalInternFindOne = Intern.findOne;
  const originalUserFindById = User.findById;
  const task = {
    assignedTo: OTHER_USER,
    assignedBy: SUPERVISOR,
    status: 'in_progress',
    progress: 30,
    comments: [],
    title: 'Old title',
    save: async () => {}
  };
  Task.findById = async () => task;
  Intern.findOne = () => chain({ _id: INTERN_PROFILE, user: OTHER_USER });
  User.findById = () => chain({ role: 'intern', isActive: true, isApproved: true });
  try {
    const res = await invoke(handler('put', '/:id'), { _id: OTHER_SUPERVISOR, role: 'admin' }, {
      body: { title: 'New title', assignedTo: OTHER_USER, assignedBy: OTHER_SUPERVISOR, status: 'completed', progress: 100, comments: [{ text: 'forged' }] }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(task.title, 'New title');
    assert.equal(task.assignedBy, SUPERVISOR);
    assert.equal(task.status, 'in_progress');
    assert.equal(task.progress, 30);
    assert.deepEqual(task.comments, []);
  } finally {
    Task.findById = originalFindById;
    Intern.findOne = originalInternFindOne;
    User.findById = originalUserFindById;
  }
});

test('interns cannot create tasks and supervisors cannot delete tasks', async () => {
  const originalCreate = Task.create;
  const originalFindById = Task.findById;
  Task.create = async () => assert.fail('Intern must not create tasks');
  Task.findById = async () => ({ deleteOne: async () => assert.fail('Supervisor must not delete tasks') });
  try {
    const create = await invoke(handler('post', '/'), { _id: INTERN_USER, role: 'intern' }, { body: { assignedTo: INTERN_USER } });
    assert.equal(create.statusCode, 403);
    const remove = await invoke(handler('delete', '/:id'), { _id: SUPERVISOR, role: 'supervisor' });
    assert.equal(remove.statusCode, 403);
  } finally {
    Task.create = originalCreate;
    Task.findById = originalFindById;
  }
});

test('interns may submit their own work for validation but cannot set a privileged status', async () => {
  const originalFindById = Task.findById;
  const task = { assignedTo: INTERN_USER, status: 'in_progress', progress: 40, save: async () => {} };
  Task.findById = async () => task;
  try {
    const submitted = await invoke(handler('patch', '/:id/status'), { _id: INTERN_USER, role: 'intern' }, { body: { status: 'completed' } });
    assert.equal(submitted.statusCode, 200);
    assert.equal(task.status, 'pending_validation');

    const forged = await invoke(handler('patch', '/:id/status'), { _id: INTERN_USER, role: 'intern' }, { body: { status: 'cancelled' } });
    assert.equal(forged.statusCode, 403);
  } finally {
    Task.findById = originalFindById;
  }
});
