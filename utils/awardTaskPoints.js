export const awardTaskPoints = async (user, points, opts = {}) => {
    const p = Number(points) || 0;

    user.rewardHistory ||= {};

    // Decide where to save
    let arrayName = "practiced";

    if (opts.type === "reading") arrayName = "reading";
    if (opts.type === "bonus") arrayName = "bonus";
    if (opts.type === "admin") arrayName = "admin";
    if (opts.arrayName) arrayName = opts.arrayName;

    user.rewardHistory[arrayName] ||= [];

    // Prevent duplicate rewards
    if (opts.key) {
        const exists = user.rewardHistory[arrayName].some(item => {
            return item.key === opts.key || item.postId === opts.key;
        });

        if (exists) {
            return user;
        }
    }

    // Award points
    user.points = (user.points || 0) + p;
    user.creditPoints = (user.creditPoints || 0) + p;

    let entry;

    switch (arrayName) {

        case "reading":
            entry = {
                postId: opts.key || opts.postId,
                points: p,
                date: new Date()
            };
            break;

        case "bonus":
        case "admin":
            entry = {
                reason: opts.reason,
                points: p,
                by: opts.by,
                date: new Date()
            };
            break;

        default:
            entry = {
                key: opts.key,
                points: p,
                date: new Date()
            };
    }

    user.rewardHistory[arrayName].push(entry);

    await user.save();

    return user;
};
