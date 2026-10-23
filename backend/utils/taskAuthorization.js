const mongoose = require('mongoose');
const Intern = require('../models/Intern');
const Team = require('../models/Team');
const User = require('../models/User');

const idString = (value) => String(value?._id || value?.id || value || '');

async function getTaskUserScope(user) {
  const userId = idString(user);
  if (user.role === 'admin') return null;
  if (user.role === 'intern') return new Set([userId]);
  if (user.role !== 'supervisor') return new Set();

  const teams = await Team.find({ supervisor: userId }).select('interns').lean();
  const teamInternIds = [...new Set(teams.flatMap((team) => team.interns || []).map(idString))];
  const internQuery = [{ supervisor: userId }];
  if (teamInternIds.length) internQuery.push({ _id: { $in: teamInternIds } });

  const interns = await Intern.find({ $or: internQuery }).select('user').lean();
  return new Set(interns.map((intern) => idString(intern.user)).filter(Boolean));
}

async function canAccessTask(user, task) {
  const scope = await getTaskUserScope(user);
  return scope === null || scope.has(idString(task.assignedTo));
}

async function canAssignTaskTo(user, assignedTo) {
  if (!mongoose.isValidObjectId(assignedTo)) return false;
  const [intern, targetUser] = await Promise.all([
    Intern.findOne({ user: assignedTo }).select('_id user').lean(),
    User.findById(assignedTo).select('role isActive isApproved').lean()
  ]);
  if (!intern || targetUser?.role !== 'intern' || !targetUser.isActive || !targetUser.isApproved) return false;
  const scope = await getTaskUserScope(user);
  return scope === null || scope.has(idString(assignedTo));
}

module.exports = { idString, getTaskUserScope, canAccessTask, canAssignTaskTo };
