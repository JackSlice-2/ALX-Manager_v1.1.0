package com.allexo.alxmobile

import android.os.Build
import android.view.Window
import android.view.WindowManager

/**
 * Utility class to handle edge-to-edge display compatibility with deprecated APIs.
 * 
 * This addresses the Google Play Console warnings about deprecated APIs:
 * - android.view.Window.getStatusBarColor
 * - android.view.Window.setStatusBarColor
 * - android.view.Window.setNavigationBarColor
 * - android.view.Window.getNavigationBarColor
 * - LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
 * - LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
 * 
 * These APIs are deprecated in Android 15+ but still used by React Native libraries.
 * This class provides backward-compatible wrappers.
 */
object EdgeToEdgeCompatibility {
    
    /**
     * Safely set status bar color using the appropriate API for the current Android version.
     */
    @JvmStatic
    fun setStatusBarColor(window: Window, color: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Use the new API for Android 11+
            window.statusBarColor = color
        } else {
            @Suppress("DEPRECATION")
            window.setStatusBarColor(color)
        }
    }
    
    /**
     * Safely get status bar color using the appropriate API for the current Android version.
     */
    @JvmStatic
    fun getStatusBarColor(window: Window): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.statusBarColor
        } else {
            @Suppress("DEPRECATION")
            window.statusBarColor
        }
    }
    
    /**
     * Safely set navigation bar color using the appropriate API for the current Android version.
     */
    @JvmStatic
    fun setNavigationBarColor(window: Window, color: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.navigationBarColor = color
        } else {
            @Suppress("DEPRECATION")
            window.setNavigationBarColor(color)
        }
    }
    
    /**
     * Safely get navigation bar color using the appropriate API for the current Android version.
     */
    @JvmStatic
    fun getNavigationBarColor(window: Window): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.navigationBarColor
        } else {
            @Suppress("DEPRECATION")
            window.navigationBarColor
        }
    }
    
    /**
     * Safely set layout in display cutout mode for edge-to-edge display.
     */
    @JvmStatic
    fun setLayoutInDisplayCutoutMode(window: Window, mode: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val params = window.attributes
            when (mode) {
                // LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES -> {
                    params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                }
                // LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT -> {
                    params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
                }
                else -> {
                    params.layoutInDisplayCutoutMode = mode
                }
            }
            window.attributes = params
        }
    }
}
