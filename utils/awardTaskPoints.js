export const awardTaskPoints = async (user, points, opts = {}) => {
    console.log("awardTaskPoints called");
    console.log("Before:", {
        points: user?.points,
        creditPoints: user?.creditPoints,
        rewardHistory: user?.rewardHistory?.length
    });

    const p = Number(points) || 0;

    if (!Array.isArray(user.rewardHistory)) {
        const old = user.rewardHistory || {};
        const migrated = [];

        (old.practiced || []).forEach(x => {
            migrated.push({
                key: x.key,
                type: "task",
                title: "",
                points: x.points,
                date: x.date
            });
        });

        (old.reading || []).forEach(x => {
            migrated.push({
                key: x.postId,
                type: "reading",
                title: "",
                points: x.points,
                date: x.date,
                referenceId: x.postId
            });
        });

        (old.bonus || []).forEach(x => {
            migrated.push({
                key: `bonus:${Date.now()}`,
                type: "bonus",
                title: x.reason,
                points: x.points,
                date: x.date,
                by: x.by
            });
        });

        (old.admin || []).forEach(x => {
            migrated.push({
                key: `admin:${Date.now()}`,
                type: "admin",
                title: x.reason,
                points: x.points,
                date: x.date,
                by: x.by
            });
        });

        (old.referrals || []).forEach(x => {
            migrated.push({
                key: `referral:${x.referredUser}`,
                type: "referral",
                title: "Referral Bonus",
                points: x.points,
                date: x.date,
                referenceId: String(x.referredUser)
            });
        });

        user.rewardHistory = migrated;
    }

    if (opts.key) {
        const exists = user.rewardHistory.some(item =>
            item.key === opts.key || item.referenceId === opts.referenceId
        );
        if (exists) {
            console.log("Reward key/referenceId already exists in history. Skipping save.");
            return user;
        }
    }

    user.points = (user.points || 0) + p;
    user.creditPoints = (user.creditPoints || 0) + p;

    user.rewardHistory.push({
        key: opts.key || null,
        type: opts.type || "task",
        title: opts.title || "",
        points: p,
        date: new Date(),
        by: opts.by || null,
        referenceId: opts.referenceId || null
    });

    console.log("Saving user...");
    await user.save();
    console.log("Saved.");
    console.log("After:", {
        points: user.points,
        creditPoints: user.creditPoints,
        rewardHistory: user.rewardHistory.length
    });

    return user;
};
