// utils/

export const awardTaskPoints = async (user, points) => {
    user.points = (user.points || 0) + points;

    // Convert task points to credit points
    user.creditPoints = (user.creditPoints || 0) + points;

    await user.save();

    return {
        points: user.points,
        creditPoints: user.creditPoints
    };
};
