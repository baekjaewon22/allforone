import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { parseInput, toValidationResponse } from "../lib/validation";

const reverseQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lon: z.coerce.number().min(-180).max(180),
});

type NominatimReverseResponse = {
	display_name?: string;
	address?: {
		state?: string;
		city?: string;
		town?: string;
		village?: string;
		county?: string;
		borough?: string;
		suburb?: string;
		quarter?: string;
		neighbourhood?: string;
	};
	error?: string;
};

export const geoRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/reverse", async (c) => {
		const query = parseInput("query", reverseQuerySchema, c.req.query());
		const cache = await caches.open("geo-reverse-v1");
		const cacheKey = new Request(
			`https://all-for-one.local/geo/reverse?lat=${query.lat.toFixed(5)}&lon=${query.lon.toFixed(5)}`,
		);
		const cached = await cache.match(cacheKey);
		if (cached) {
			return cached;
		}

		const url = new URL("https://nominatim.openstreetmap.org/reverse");
		url.searchParams.set("format", "jsonv2");
		url.searchParams.set("lat", String(query.lat));
		url.searchParams.set("lon", String(query.lon));
		url.searchParams.set("zoom", "14");
		url.searchParams.set("addressdetails", "1");
		url.searchParams.set("accept-language", "ko,en");

		const response = await fetch(url, {
			headers: {
				accept: "application/json",
				"accept-language": "ko,en;q=0.8",
				"user-agent": "AllForOne/1.0 (personal dashboard; https://all-for-one-db9.pages.dev)",
			},
		});
		const body = (await response.json()) as NominatimReverseResponse;
		if (!response.ok || body.error) {
			return c.json({ ok: false, error: body.error ?? "reverse_geocode_failed" }, 502);
		}

		const payload = {
			ok: true,
			location: {
				lat: query.lat,
				lon: query.lon,
				region: formatRegion(body.address) ?? body.display_name ?? "",
				displayName: body.display_name ?? "",
				address: body.address ?? {},
			},
		};
		const result = c.json(payload);
		result.headers.set("cache-control", "public, max-age=86400");
		c.executionCtx.waitUntil(cache.put(cacheKey, result.clone()));
		return result;
	});

function formatRegion(address?: NominatimReverseResponse["address"]) {
	if (!address) {
		return undefined;
	}

	const values = [
		normalizeSeoul(address.state),
		address.city ?? address.town ?? address.village ?? address.county,
		address.borough ?? address.suburb ?? address.quarter ?? address.neighbourhood,
	]
		.filter(Boolean)
		.filter((item, index, items) => items.indexOf(item) === index);

	return values.length ? values.join(" ") : undefined;
}

function normalizeSeoul(value?: string) {
	if (!value) {
		return value;
	}
	return value === "서울특별시" ? "서울시" : value;
}
