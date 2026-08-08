# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Keep compatibility with deprecated edge-to-edge APIs (Android 15+)
# These APIs are deprecated but still needed for backward compatibility
-keep class android.view.Window {
    public * getStatusBarColor(...);
    public * setStatusBarColor(...);
    public * setNavigationBarColor(...);
    public * getNavigationBarColor(...);
}

# Keep Layout in display cutout modes for compatibility
-keep class android.view.WindowManager {
    public static final int LAYOUT_IN_DISPLAY_CUTOUT_MODE_*;
}

# Keep React Native Screens compatibility
-keep class com.swmansion.rnscreens.** { *; }

# Keep StatusBarModule compatibility
-keep class com.facebook.react.modules.statusbar.** { *; }

# Keep Material Components edge-to-edge utilities
-keep class com.google.android.material.** { *; }
