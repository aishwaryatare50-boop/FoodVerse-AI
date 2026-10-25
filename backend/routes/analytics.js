const express = require('express');
const router = express.Router();
const FoodLog = require('../models/FoodLog');
const { protect } = require('../middleware/auth');

// All analytics routes require authentication
router.use(protect);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get aggregated nutrition and activity analytics for current user
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Check if user has any logs; if not, return empty structure or auto-seed indicator
    const totalCount = await FoodLog.countDocuments({ user: userId });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 2. Today's meals & totals
    const todayLogs = await FoodLog.find({
      user: userId,
      loggedAt: { $gte: startOfToday },
    });

    const todayCalories = todayLogs.reduce((sum, item) => sum + (item.calories || 0), 0);
    const todayProtein = todayLogs.reduce((sum, item) => sum + (item.macros?.protein_g || 0), 0);
    const todayCarbs = todayLogs.reduce((sum, item) => sum + (item.macros?.carbs_g || 0), 0);
    const todayFat = todayLogs.reduce((sum, item) => sum + (item.macros?.fat_g || 0), 0);
    const todayFiber = todayLogs.reduce((sum, item) => sum + (item.macros?.fiber_g || 0), 0);

    // 3. Last 7 Days trend grouped by date string
    const recentLogs = await FoodLog.find({
      user: userId,
      loggedAt: { $gte: sevenDaysAgo },
    }).sort({ loggedAt: 1 });

    const daysMap = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      daysMap[key] = {
        date: key,
        day: dayNames[d.getDay()],
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        healthScoreSum: 0,
        count: 0,
      };
    }

    recentLogs.forEach((log) => {
      const key = new Date(log.loggedAt).toISOString().split('T')[0];
      if (daysMap[key]) {
        daysMap[key].calories += log.calories || 0;
        daysMap[key].protein_g += log.macros?.protein_g || 0;
        daysMap[key].carbs_g += log.macros?.carbs_g || 0;
        daysMap[key].fat_g += log.macros?.fat_g || 0;
        if (log.healthScore) {
          daysMap[key].healthScoreSum += log.healthScore;
          daysMap[key].count += 1;
        }
      }
    });

    const weeklyTrend = Object.values(daysMap).map((d) => ({
      ...d,
      avgHealthScore: d.count > 0 ? Math.round(d.healthScoreSum / d.count) : 0,
    }));

    // 4. Activity breakdown by module
    const typeAggregation = await FoodLog.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const moduleCounts = {
      food_recognition: 0,
      freshness: 0,
      hygiene: 0,
      cooking: 0,
      meal_plan: 0,
      manual_meal: 0,
    };
    typeAggregation.forEach((item) => {
      if (moduleCounts[item._id] !== undefined) {
        moduleCounts[item._id] = item.count;
      }
    });

    // 5. Overall Average Health Score
    const allHealthScores = await FoodLog.find({
      user: userId,
      healthScore: { $gt: 0 },
    }).select('healthScore healthGrade');

    const avgHealthScore =
      allHealthScores.length > 0
        ? Math.round(
            allHealthScores.reduce((sum, l) => sum + l.healthScore, 0) / allHealthScores.length
          )
        : 0;

    // Grade distribution
    const gradeDistribution = { 'A+': 0, A: 0, B: 0, C: 0, D: 0 };
    allHealthScores.forEach((item) => {
      const g = item.healthGrade || 'B';
      if (gradeDistribution[g] !== undefined) {
        gradeDistribution[g]++;
      }
    });

    // 6. Recent 15 Activity Logs
    const recentActivity = await FoodLog.find({ user: userId })
      .sort({ loggedAt: -1 })
      .limit(15);

    // Calculate streak days (consecutive days with at least 1 log)
    let streakDays = 0;
    const sortedDates = Object.keys(daysMap).sort().reverse();
    for (const dKey of sortedDates) {
      if (daysMap[dKey].calories > 0 || daysMap[dKey].count > 0) {
        streakDays++;
      } else {
        break;
      }
    }
    if (streakDays === 0 && totalCount > 0) streakDays = 1;

    res.json({
      success: true,
      data: {
        totalLogsCount: totalCount,
        streakDays,
        dailyTargetCalories: req.user.dietaryProfile?.dailyCalorieTarget || 2000,
        today: {
          calories: todayCalories,
          protein_g: Math.round(todayProtein),
          carbs_g: Math.round(todayCarbs),
          fat_g: Math.round(todayFat),
          fiber_g: Math.round(todayFiber),
          mealsCount: todayLogs.length,
        },
        avgHealthScore,
        gradeDistribution,
        weeklyTrend,
        moduleCounts,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics summary' });
  }
});

/**
 * @route   POST /api/analytics/log
 * @desc    Save an analysis event or meal record
 */
router.post('/log', async (req, res) => {
  try {
    const {
      type,
      title,
      summary,
      calories,
      macros,
      healthScore,
      healthGrade,
      details,
      loggedAt,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const newLog = await FoodLog.create({
      user: req.user._id,
      type: type || 'food_recognition',
      title,
      summary: summary || '',
      calories: calories || 0,
      macros: macros || { protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
      healthScore: healthScore !== undefined ? healthScore : 80,
      healthGrade: healthGrade || 'B',
      details: details || {},
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    });

    res.status(201).json({ success: true, log: newLog });
  } catch (error) {
    console.error('Log creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create log entry' });
  }
});

/**
 * @route   DELETE /api/analytics/log/:id
 * @desc    Delete a log entry
 */
router.delete('/log/:id', async (req, res) => {
  try {
    const log = await FoodLog.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    await log.deleteOne();
    res.json({ success: true, message: 'Log entry deleted successfully' });
  } catch (error) {
    console.error('Log deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete log entry' });
  }
});

module.exports = router;
