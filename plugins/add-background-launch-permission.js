module.exports = function withBackgroundLaunchPermission(config) {
  if (!config.android) config.android = {};
  if (!config.android.permissions) config.android.permissions = [];

  config.android.permissions.push(
    "android.permission.START_ACTIVITIES_FROM_BACKGROUND"
  );

  return config;
};
