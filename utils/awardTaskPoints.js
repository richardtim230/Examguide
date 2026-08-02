// utils/awardTaskPoints.js
export const awardTaskPoints = async (user, points, opts = {}) => {
  // points: number
  // opts: { key, type, reason, by, arrayName }
  const p = Number(points) || 0;

  // numeric updates
  user.points = (user.points || 0) + p;
  user.creditPoints = (user.creditPoints || 0) + p;

  // ensure rewardHistory shape exists
  user.rewardHistory = user.rewardHistory || {};

  // default mapping: treat "reading" separately, otherwise use "practiced"
  const defaultArray = (opts.type === 'reading' || opts.arrayName === 'reading') ? 'reading' : 'practiced';
  const arrayName = opts.arrayName || defaultArray;

  user.rewardHistory[arrayName] = user.rewardHistory[arrayName] || [];

  const entry = {
    key: opts.key || null,            // e.g., "task:abcdef" or "article:123"
    points: p,
    date: new Date(),
    reason: opts.reason || opts.type || null,
    by: opts.by || null
  };

  user.rewardHistory[arrayName].push(entry);

  await user.save();

  // Return updated user object (lean callers may expect points/creditPoints)
  return user;
};
