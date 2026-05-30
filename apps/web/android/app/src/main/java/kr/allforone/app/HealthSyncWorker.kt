package kr.allforone.app

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Periodically reads Health Connect daily summaries and uploads them to the AFO API
 * even while the app is closed. Configuration (API base URL + device ingest key) is
 * persisted by [AfoHealthConnectPlugin.enableBackgroundSync] into SharedPreferences.
 */
class HealthSyncWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val apiBaseUrl = prefs.getString(KEY_API_BASE, null)?.trimEnd('/')
        val deviceKey = prefs.getString(KEY_DEVICE_KEY, null)
        val days = prefs.getInt(KEY_DAYS, 7).coerceIn(1, 31)

        if (apiBaseUrl.isNullOrBlank()) {
            // Not configured yet; nothing we can do until the app runs once.
            return Result.success()
        }

        return when (val outcome = HealthConnectReader.read(applicationContext, days)) {
            is HealthConnectReader.Outcome.Unavailable -> Result.success()
            // Permission can only be granted from the foreground, so retrying is pointless.
            is HealthConnectReader.Outcome.NeedsPermission -> Result.success()
            is HealthConnectReader.Outcome.Success -> {
                if (outcome.summaries.isEmpty()) {
                    return Result.success()
                }
                val payload = buildPayload(outcome)
                if (postSync(apiBaseUrl, deviceKey, payload)) {
                    Result.success()
                } else {
                    Result.retry()
                }
            }
        }
    }

    private fun buildPayload(success: HealthConnectReader.Outcome.Success): JSONObject {
        val summaries = JSONArray()
        for (item in success.summaries) {
            val obj = JSONObject()
            obj.put("date", item.date)
            obj.put("deviceId", success.deviceId)
            item.steps?.let { obj.put("steps", it) }
            item.sleepMinutes?.let { obj.put("sleepMinutes", it) }
            item.exerciseMinutes?.let { obj.put("exerciseMinutes", it) }
            item.activeCalories?.let { obj.put("activeCalories", it) }
            item.totalCalories?.let { obj.put("totalCalories", it) }
            item.distanceMeters?.let { obj.put("distanceMeters", it) }
            item.heartRateAvg?.let { obj.put("heartRateAvg", it) }
            item.heartRateMin?.let { obj.put("heartRateMin", it) }
            item.heartRateMax?.let { obj.put("heartRateMax", it) }
            item.weightKg?.let { obj.put("weightKg", it) }
            obj.put("source", item.source)
            obj.put("syncedAt", item.syncedAt)
            summaries.put(obj)
        }
        return JSONObject().apply {
            put("deviceId", success.deviceId)
            put("lastSyncedAt", success.lastSyncedAt)
            put("summaries", summaries)
        }
    }

    private fun postSync(apiBaseUrl: String, deviceKey: String?, payload: JSONObject): Boolean {
        var connection: HttpURLConnection? = null
        return try {
            val url = URL("$apiBaseUrl/health-connect/sync")
            connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 20_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                if (!deviceKey.isNullOrBlank()) {
                    setRequestProperty("X-AFO-Device-Key", deviceKey)
                }
            }
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            // 2xx = stored. 401 (bad key) won't recover by retrying, so treat as terminal success.
            code in 200..299 || code == 401
        } catch (error: Exception) {
            false
        } finally {
            connection?.disconnect()
        }
    }

    companion object {
        const val PREFS = "afo_health_sync"
        const val KEY_API_BASE = "apiBaseUrl"
        const val KEY_DEVICE_KEY = "deviceKey"
        const val KEY_DAYS = "days"
        private const val UNIQUE_WORK = "afo-health-connect-sync"

        fun schedule(
            context: Context,
            apiBaseUrl: String,
            deviceKey: String?,
            days: Int,
            intervalMinutes: Long,
        ) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().apply {
                putString(KEY_API_BASE, apiBaseUrl.trimEnd('/'))
                if (deviceKey.isNullOrBlank()) remove(KEY_DEVICE_KEY) else putString(KEY_DEVICE_KEY, deviceKey)
                putInt(KEY_DAYS, days.coerceIn(1, 31))
                apply()
            }

            // WorkManager enforces a 15-minute minimum periodic interval.
            val interval = intervalMinutes.coerceAtLeast(15)
            val request = PeriodicWorkRequestBuilder<HealthSyncWorker>(interval, TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build(),
                )
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK,
                ExistingPeriodicWorkPolicy.UPDATE,
                request,
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_WORK)
        }
    }
}
