module.exports = function withWifiPermissions(config) {
  return {
    ...config,
    android: {
      ...config.android,
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.CHANGE_WIFI_STATE",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CHANGE_NETWORK_STATE",
        "android.permission.NEARBY_WIFI_DEVICES",
        "android.permission.INTERNET"
      ],
    },
  };
};
