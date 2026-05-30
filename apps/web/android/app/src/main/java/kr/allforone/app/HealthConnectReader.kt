package kr.allforone.app

import android.content.Context
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
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Shared Health Connect read logic used by both the foreground Capacitor plugin
 * ([AfoHealthConnectPlugin]) and the background WorkManager job ([HealthSyncWorker]).
 */
object HealthConnectReader {
    /** Record read permissions that gate whether a sync can run at all. */
    val readPermissions: Set<String> = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
    )

    /**
     * Permissions to request from the user. Background access is requested too so that
     * the periodic worker can read while the app is closed, but it is optional — its
     * absence only disables background sync, it never blocks foreground reads.
     */
    val requestPermissions: Set<String> =
        readPermissions + HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND

    data class DailySummary(
        val date: String,
        val steps: Int?,
        val sleepMinutes: Int?,
        val exerciseMinutes: Int?,
        val activeCalories: Double?,
        val totalCalories: Double?,
        val distanceMeters: Double?,
        val heartRateAvg: Double?,
        val heartRateMin: Double?,
        val heartRateMax: Double?,
        val weightKg: Double?,
        val source: String,
        val syncedAt: String,
    )

    sealed class Outcome {
        data class Unavailable(val sdkStatus: Int) : Outcome()
        data class NeedsPermission(val missing: List<String>) : Outcome()
        data class Success(
            val deviceId: String,
            val lastSyncedAt: String,
            val summaries: List<DailySummary>,
        ) : Outcome()
    }

    fun deviceId(context: Context): String =
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "android"

    suspend fun read(context: Context, days: Int): Outcome {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            return Outcome.Unavailable(status)
        }

        val client = HealthConnectClient.getOrCreate(context)
        val granted = client.permissionController.getGrantedPermissions()
        val missing = readPermissions.filterNot { granted.contains(it) }
        if (missing.isNotEmpty()) {
            return Outcome.NeedsPermission(missing)
        }

        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val now = Instant.now().toString()
        val summaries = ArrayList<DailySummary>(days)
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

            summaries.add(
                DailySummary(
                    date = date.toString(),
                    steps = response[StepsRecord.COUNT_TOTAL]?.toInt(),
                    sleepMinutes = response[SleepSessionRecord.SLEEP_DURATION_TOTAL]?.toMinutes()?.toInt(),
                    exerciseMinutes = response[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.toMinutes()?.toInt(),
                    activeCalories = response[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories,
                    totalCalories = response[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.inKilocalories,
                    distanceMeters = response[DistanceRecord.DISTANCE_TOTAL]?.inMeters,
                    heartRateAvg = response[HeartRateRecord.BPM_AVG]?.toDouble(),
                    heartRateMin = response[HeartRateRecord.BPM_MIN]?.toDouble(),
                    heartRateMax = response[HeartRateRecord.BPM_MAX]?.toDouble(),
                    weightKg = response[WeightRecord.WEIGHT_AVG]?.inKilograms,
                    source = "android-health-connect",
                    syncedAt = now,
                ),
            )
        }

        return Outcome.Success(deviceId(context), now, summaries)
    }
}
