export const awardTaskPoints = async (user, points, opts = {}) => {
    const p = Number(points) || 0;

    if (!Array.isArray(user.rewardHistory)) {
        user.rewardHistory = [];
    }

    if (opts.key) {
        const exists = user.rewardHistory.some(item =>
            item.key === opts.key || item.referenceId === opts.referenceId
        );
        if (exists) {
            return user;
        }
    }

    user.points = (user.points || 0) + p;
    
    user.rewardHistory.push({
        key: opts.key || null,
        type: opts.type || "task",
        title: opts.title || "",
        points: p,
        date: new Date(),
        by: opts.by || null,
        referenceId: opts.referenceId || null
    });

    await user.save();
    return user;
};
