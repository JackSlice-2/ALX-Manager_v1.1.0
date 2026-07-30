package com.allexo.alxmobile

import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import android.util.Log
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

class InAppUpdateHelper(private val activity: Activity) {
    
    companion object {
        private const val TAG = "InAppUpdateHelper"
        const val REQUEST_CODE_UPDATE = 1001
    }
    
    private val appUpdateManager: AppUpdateManager by lazy {
        Log.d(TAG, "🛠️  Creating AppUpdateManager")
        AppUpdateManagerFactory.create(activity)
    }
    
    /**
     * Check for available updates and start flexible update if available
     */
    fun checkForUpdates() {
        Log.d(TAG, "🔍 Starting update check...")
        
        appUpdateManager.appUpdateInfo.addOnSuccessListener { appUpdateInfo ->
            Log.d(TAG, "✅ Update check completed!")
            Log.d(TAG, "   Update Availability: ${appUpdateInfo.updateAvailability()}")
            Log.d(TAG, "   Available Version: ${appUpdateInfo.availableVersionCode()}")
            Log.d(TAG, "   Flexible Allowed: ${appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)}")
            
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
                appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                
                Log.d(TAG, "🎉 UPDATE AVAILABLE! Starting flexible update flow...")
                startFlexibleUpdate(appUpdateInfo)
            } else {
                Log.d(TAG, "✅ No flexible update available")
            }
        }.addOnFailureListener { exception ->
            Log.e(TAG, "❌ Failed to check for updates: ${exception.message}")
            exception.printStackTrace()
        }
    }
    
    /**
     * Start the flexible update flow
     */
    private fun startFlexibleUpdate(appUpdateInfo: AppUpdateInfo) {
        try {
            Log.d(TAG, "🚀 Starting flexible update flow...")
            
            val appUpdateOptions = AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE)
                .setAllowAssetPackDeletion(true)
                .build()
            
            appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                activity,
                appUpdateOptions,
                REQUEST_CODE_UPDATE
            )
            
            Log.d(TAG, "✅ Flexible update flow started successfully!")
            
        } catch (e: IntentSender.SendIntentException) {
            Log.e(TAG, "❌ Failed to start update flow: ${e.message}")
            e.printStackTrace()
        }
    }
    
    /**
     * Handle the result of the update flow
     */
    fun handleUpdateResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
        if (requestCode == REQUEST_CODE_UPDATE) {
            Log.d(TAG, "📊 Update flow result: $resultCode")
            when (resultCode) {
                Activity.RESULT_OK -> {
                    Log.d(TAG, "✅ Update flow completed! Calling completeUpdate()...")
                    appUpdateManager.completeUpdate()
                }
                Activity.RESULT_CANCELED -> {
                    Log.d(TAG, "❌ Update flow canceled by user")
                }
                else -> {
                    Log.d(TAG, "❌ Update flow failed with code: $resultCode")
                }
            }
            return true
        }
        return false
    }
    

}