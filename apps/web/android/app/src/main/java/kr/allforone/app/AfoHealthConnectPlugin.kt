package kr.allforone.app

import android.content.Intent
import android.provider.Settings
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZoneId

@CapacitorPlugin(name = "AfoHealthConnect")
class AfoHealthConnectPlugin : Plugin() {
    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
    )

    @PluginMethod
    fun openSettings(call: PluginCall) {
        try {
            context.startActivity(Intent(Settings.ACTION_APPLICATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            call.resolve()
        } catch (error: Exception) {
            call.reject("settings_open_failed", error)
        }
    }

    @PluginMethod
    fun readDailySummaries(call: PluginCall) {
        val days = (call.getInt("days") ?: 7).coerceIn(1, 31)
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            val result = JSObject()
            result.put("available", false)
            result.put("sdkStatus", status)
            call.resolve(result)
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                val missing = permissions.filterNot { granted.contains(it) }
                if (missing.isNotEmpty()) {
                    val result = JSObject()
                    result.put("available", true)
                    result.put("needsPermission", true)
                    result.put("missing", JSArray(missing))
                    call.resolve(result)
                    return@launch
                }

                val zone = ZoneId.systemDefault()
                val today = LocalDate.now(zone)
                val summaries = JSArray()
                for (offset in days - 1 downTo 0) {
                    val date = today.minusDays(offset.toLong())
                    val start = date.atStartOfDay(zone).toInstant()
                    val end = date.plusDays(1).atStartOfDay(zone).toInstant()
                    val response = client.aggregate(
                        AggregateRequest(
                            metrics = setOf(
                                StepsRecord.COUNT_TOTAL,
                                SleepSessionRecord.SLEEP_DURATION_TOTAL,
                                ExerciseSessionRecord.EXERCISE_DURATION_TOTAL,
                                ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
                                TotalCaloriesBurnedRecord.ENERGY_TOTAL,
                                DistanceRecord.DISTANCE_TOTAL,
                                HeartRateRecord.BPM_AVG,
                                HeartRateRecord.BPM_MIN,
                                HeartRateRecord.BPM_MAX,
                                WeightRecord.WEIGHT_AVG,
                            ),
                            timeRangeFilter = TimeRangeFilter.between(start, end),
                        ),
                    )

                    val summary = JSObject()
                    summary.put("date", date.toString())
                    summary.put("steps", response[StepsRecord.COUNT_TOTAL]?.toInt())
                    summary.put("sleepMinutes", response[SleepSessionRecord.SLEEP_DURATION_TOTAL]?.toMinutes()?.toInt())
                    summary.put("exerciseMinutes", response[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.toMinutes()?.toInt())
                    summary.put("activeCalories", response[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories)
                    summary.put("totalCalories", response[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.inKilocalories)
                    summary.put("distanceMeters", response[DistanceRecord.DISTANCE_TOTAL]?.inMeters)
                    summary.put("heartRateAvg", response[HeartRateRecord.BPM_AVG])
                    summary.put("heartRateMin", response[HeartRateRecord.BPM_MIN])
                    summary.put("heartRateMax", response[HeartRateRecord.BPM_MAX])
                    summary.put("weightKg", response[WeightRecord.WEIGHT_AVG]?.inKilograms)
                    summary.put("source", "android-health-connect")
                    summary.put("syncedAt", java.time.Instant.now().toString())
                    summaries.put(summary)
                }

                val result = JSObject()
                result.put("available", true)
                result.put("needsPermission", false)
                result.put("deviceId", Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "android")
                result.put("lastSyncedAt", java.time.Instant.now().toString())
                result.put("summaries", summaries)
                call.resolve(result)
            } catch (error: Exception) {
                call.reject("health_connect_read_failed", error)
            }
        }
    }
}