import type { AiReport, PersonalSchedule } from "@all-for-one/shared";
import type { Bindings } from "../index";
import { listAiReports, listPersonalSchedules } from "../repositories/personal-os";

const SEOUL_TIME_ZONE = "Asia/Seoul";
const DAILY_SLACK_SENT_PREFIX = "slack:daily-digest:";

type SeoulDateTime = {
	date: string;
	hour: number;
	minute: number;
};

export async function sendDailySlackDigestIfDue(env: Bindings, scheduledTime: number) {
	if (!env.SLACK_WEBHOOK_URL) {
		return;
	}

	const seoul = getSeoulDateTime(new Date(scheduledTime));
	if (seoul.hour !== 9 || seoul.minute > 14) {
		return;
	}

	const sentKey = `${DAILY_SLACK_SENT_PREFIX}${seoul.date}`;
	const alreadySent = await env.SESSIONS.get(sentKey);
	if (alreadySent) {
		return;
	}

	const dayRange = getSeoulDayRangeUtc(seoul.date);
	const [schedules, reports] = await Promise.all([
		listPersonalSchedules(env.DB, dayRange),
		listAiReports(env.DB),
	]);

	await postSlackDigest(
		env.SLACK_WEBHOOK_URL,
		buildDailyDigestMessage(seoul.date, schedules, reports),
	);
	await env.SESSIONS.put(sentKey, new Date().toISOString(), {
		expirationTtl: 36 * 60 * 60,
	});
}

function buildDailyDigestMessage(
	date: string,
	schedules: PersonalSchedule[],
	reports: AiReport[],
) {
	const openReports = reports
		.filter((report) => report.status === "received" || report.status === "needs_review")
		.slice(0, 8);

	return {
		text: `All For One ${date} 오늘 스케줄 / 업무보고`,
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: `오늘 스케줄 / 업무보고 (${date})`,
					emoji: false,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*오늘 스케줄* ${schedules.length}건\n${formatSchedules(schedules)}`,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*업무보고* ${openReports.length}건\n${formatReports(openReports)}`,
				},
			},
		],
	};
}

function formatSchedules(schedules: PersonalSchedule[]) {
	if (!schedules.length) {
		return "등록된 스케줄이 없습니다.";
	}

	return schedules
		.slice(0, 10)
		.map((schedule) => {
			const fixed = schedule.tags?.includes("fixed") ? " · 고정" : "";
			const place = schedule.location ? ` · ${schedule.location}` : "";
			return `• ${formatSeoulTime(schedule.startAt)} ${schedule.title}${fixed}${place}`;
		})
		.join("\n");
}

function formatReports(reports: AiReport[]) {
	if (!reports.length) {
		return "확인할 업무보고가 없습니다.";
	}

	return reports
		.map((report) => {
			const status = report.status === "needs_review" ? "검토 필요" : "수신";
			return `• [${status}] ${report.taskTitle} · ${report.provider}`;
		})
		.join("\n");
}

async function postSlackDigest(webhookUrl: string, payload: unknown) {
	const response = await fetch(webhookUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(`Slack daily digest failed: ${response.status}`);
	}
}

function getSeoulDateTime(date: Date): SeoulDateTime {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: SEOUL_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);
	const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

	return {
		date: `${value("year")}-${value("month")}-${value("day")}`,
		hour: Number(value("hour")),
		minute: Number(value("minute")),
	};
}

function getSeoulDayRangeUtc(date: string) {
	const start = new Date(`${date}T00:00:00+09:00`);
	const end = new Date(`${date}T23:59:59.999+09:00`);

	return {
		from: start.toISOString(),
		to: end.toISOString(),
	};
}

function formatSeoulTime(iso: string) {
	return new Intl.DateTimeFormat("ko-KR", {
		timeZone: SEOUL_TIME_ZONE,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(new Date(iso));
}
