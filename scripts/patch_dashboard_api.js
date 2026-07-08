const fs = require('fs');
let code = fs.readFileSync('/var/www/eslesbulus-api/src/routes/admin.js', 'utf8');

// Find the end of the dashboard endpoint (after the res.json block)
const oldResJson = `    res.json({
      totalUsers,
      todayUsers,
      weekUsers,
      onlineUsers,
      totalPosts,
      todayPosts,
      totalChats,
      totalMessages,
      totalStories,
      premiumUsers,
      totalTokensInCirculation: totalTokens[0]?.total || 0,
      connectedSockets,
    });`;

const newResJson = `    // Gender counts
    const genderAgg = await User.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);
    const genderMap = {};
    genderAgg.forEach(g => { genderMap[g._id || 'Diger'] = g.count; });

    // Fake user count
    const fakeUsers = await User.countDocuments({ role: { $in: ['fake-bot', 'fake-manual'] } });

    // Maintenance & bot status
    const { getSettings } = require("../middleware/maintenance");
    const settings = await getSettings();

    res.json({
      totalUsers,
      todayRegistrations: todayUsers,
      todayUsers,
      weekUsers,
      onlineUsers,
      totalPosts,
      todayPosts,
      totalChats,
      totalMessages,
      totalStories,
      premiumUsers,
      fakeUsers,
      totalTokensInCirculation: totalTokens[0]?.total || 0,
      connectedSockets,
      genderMale: genderMap['Erkek'] || 0,
      genderFemale: (genderMap['Kadin'] || 0) + (genderMap['Kadın'] || 0),
      genderOther: (genderMap['Diger'] || 0) + (genderMap['Diğer'] || 0) + (genderMap[''] || 0),
      botEnabled: settings?.botEnabled || false,
      maintenanceMode: settings?.maintenanceMode || false,
    });`;

if (code.includes(oldResJson)) {
  code = code.replace(oldResJson, newResJson);
  fs.writeFileSync('/var/www/eslesbulus-api/src/routes/admin.js', code);
  console.log('Dashboard API patched OK');
} else {
  console.log('Could not find exact match in admin.js');
  // Try to find partial match
  if (code.includes('totalTokensInCirculation')) {
    console.log('Found partial - attempting fuzzy patch');
  }
}
