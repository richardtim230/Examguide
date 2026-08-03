import User from "../models/User.js";

/**
 * Safely award points to a user.
 * - Reloads the latest user document from DB to avoid stale in-memory checks.
 * - Migrates legacy rewardHistory shape to an array when needed.
 * - Performs duplicate detection using both key and referenceId.
 */
export const awardTaskPoints = async (user, points, opts = {}) => {
    console.log("awardTaskPoints called");

    // Ensure we have a fresh user document from DB to avoid stale rewardHistory
    let userDoc = user;
    try {
        if (user && user._id) {
            userDoc = await User.findById(user._id);
        }
    } catch (err) {
        console.warn("Could not reload user in awardTaskPoints:", err);
    }

    if (!userDoc) {
        throw new Error("User not found when awarding points");
    }

    console.log("Before:", {
        points: userDoc?.points,
        creditPoints: userDoc?.creditPoints,
        rewardHistory: Array.isArray(userDoc.rewardHistory) ? userDoc.rewardHistory.length : typeof userDoc.rewardHistory
    });

    const p = Number(points) || 0;

    // Migrate legacy rewardHistory shapes into an array if necessary
    if (!Array.isArray(userDoc.rewardHistory)) {
        const old = userDoc.rewardHistory || {};
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

        userDoc.rewardHistory = migrated;
    }

    // Duplicate detection: check both key and referenceId on fresh data
    if (opts.key || opts.referenceId) {
        const exists = (userDoc.rewardHistory || []).some(item => {
            if (opts.key && item.key && String(item.key) === String(opts.key)) return true;
            if (opts.referenceId && item.referenceId && String(item.referenceId) === String(opts.referenceId)) return true;
            return false;
        });

        if (exists) {
            console.log("Reward key/referenceId already exists in history. Skipping save.");
            return userDoc;
        }
    }

    // Ensure arrays/fields exist
    userDoc.points = (userDoc.points || 0) + p;
    userDoc.creditPoints = (userDoc.creditPoints || 0) + p;
    userDoc.rewardHistory = userDoc.rewardHistory || [];

    userDoc.rewardHistory.push({
        key: opts.key || null,
        type: opts.type || "task",
        title: opts.title || "",
        points: p,
        date: new Date(),
        by: opts.by || null,
        referenceId: opts.referenceId || null
    });

    console.log("Saving user...");
    await userDoc.save();
    console.log("Saved.");
    console.log("After:", {
        points: userDoc.points,
        creditPoints: userDoc.creditPoints,
        rewardHistory: userDoc.rewardHistory.length
    });

    return userDoc;
};
