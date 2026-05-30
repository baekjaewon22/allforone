package kr.allforone.app

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "AfoHealthConnect")
class AfoHealthConnectPlugin : Plugin() {
    private var permissionCall: PluginCall? = null
    private lateinit var permissionLauncher: ActivityResultLauncher<Set<String>>

    override fun load() {
        permissionLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract(),
        ) {
            val call = permissionCall ?: return@registerForActivityResult
            permissionCall = null
            resolveCurrentPermissionResult(call)
        }
    }

    @PluginMethod
    fun openSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.parse("package:${context.packageName}"))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (error: Exception) {
            call.reject("settings_open_failed", error)
        }
    }

    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            val result = JSObject()
            result.put("available", false)
            result.put("sdkStatus", status)
            call.resolve(result)
            return
        }

        if (permissionCall != null) {
            call.reject("permission_request_in_progress")
            return
        }

        permissionCall = call
        activity.runOnUiThread {
            permissionLauncher.launch(HealthConnectReader.requestPermissions)
        }
    }

    @PluginMethod
    fun readDailySummaries(call: PluginCall) {
        val days = (call.getInt("days") ?: 7).coerceIn(1, 31)
        CoroutineScope(Dispatchers.IO).launch {
            try {
                when (val outcome = HealthConnectReader.read(context, days)) {
                    is HealthConnectReader.Outcome.Unavailable -> {
                        val result = JSObject()
                        result.put("available", false)
                        result.put("sdkStatus", outcome.sdkStatus)
                        call.resolve(result)
                    }
                    is HealthConnectReader.Outcome.NeedsPermission -> {
                        val result = JSObject()
                        result.put("available", true)
                        result.put("needsPermission", true)
                        result.put("missing", JSArray(outcome.missing))
                        call.resolve(result)
                    }
                    is HealthConnectReader.Outcome.Success -> {
                        val summaries = JSArray()
                        for (item in outcome.summaries) {
                            val summary = JSObject()
                            summary.put("date", item.date)
                            summary.put("steps", item.steps)
                            summary.put("sleepMinutes", item.sleepMinutes)
                            summary.put("exerciseMinutes", item.exerciseMinutes)
                            summary.put("activeCalories", item.activeCalories)
                            summary.put("totalCalories", item.totalCalories)
                            summary.put("distanceMeters", item.distanceMeters)
                            summary.put("heartRateAvg", item.heartRateAvg)
                            summary.put("heartRateMin", item.heartRateMin)
                            summary.put("heartRateMax", item.heartRateMax)
                            summary.put("weightKg", item.weightKg)
                            summary.put("source", item.source)
                            summary.put("syncedAt", item.syncedAt)
                            summaries.put(summary)
                        }
                        val result = JSObject()
                        result.put("available", true)
                        result.put("needsPermission", false)
                        result.put("deviceId", outcome.deviceId)
                        result.put("lastSyncedAt", outcome.lastSyncedAt)
                        result.put("summaries", summaries)
                        call.resolve(result)
                    }
                }
            } catch (error: Exception) {
                call.reject("health_connect_read_failed", error)
            }
        }
    }

    @PluginMethod
    fun enableBackgroundSync(call: PluginCall) {
        val apiBaseUrl = call.getString("apiBaseUrl")
        if (apiBaseUrl.isNullOrBlank()) {
            call.reject("missing_api_base_url")
            return
        }
        val deviceKey = call.getString("deviceKey")
        val days = (call.getInt("days") ?: 7).coerceIn(1, 31)
        val intervalMinutes = (call.getInt("intervalMinutes") ?: 360).toLong()

        try {
            HealthSyncWorker.schedule(context, apiBaseUrl, deviceKey, days, intervalMinutes)
            val result = JSObject()
            result.put("scheduled", true)
            result.put("intervalMinutes", intervalMinutes.coerceAtLeast(15))
            call.resolve(result)
        } catch (error: Exception) {
            call.reject("background_sync_schedule_failed", error)
        }
    }

    @PluginMethod
    fun disableBackgroundSync(call: PluginCall) {
        try {
            HealthSyncWorker.cancel(context)
            call.resolve()
        } catch (error: Exception) {
            call.reject("background_sync_cancel_failed", error)
        }
    }

    private fun resolveCurrentPermissionResult(call: PluginCall) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                val missing = HealthConnectReader.readPermissions.filterNot { granted.contains(it) }
                val result = JSObject()
                result.put("available", true)
                result.put("granted", JSArray(granted.toList()))
                result.put("missing", JSArray(missing))
                result.put("needsPermission", missing.isNotEmpty())
                call.resolve(result)
            } catch (error: Exception) {
                call.reject("health_connect_permission_check_failed", error)
            }
        }
    }
}
