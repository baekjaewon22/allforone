export type AesGcmEnvelope = {
	alg: "AES-GCM";
	v: 1;
	iv: string;
	ciphertext: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64Url = (bytes: Uint8Array): string => {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
};

const base64UrlToBytes = (value: string): Uint8Array => {
	const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
	const padded = base64.padEnd(
		base64.length + ((4 - (base64.length % 4)) % 4),
		"=",
	);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
};

export const importAesGcmKey = async (
	rawKey: BufferSource,
	usages: KeyUsage[] = ["encrypt", "decrypt"],
): Promise<CryptoKey> => {
	return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, usages);
};

export const generateAesGcmKey = async (): Promise<CryptoKey> => {
	return crypto.subtle.generateKey(
		{
			name: "AES-GCM",
			length: 256,
		},
		true,
		["encrypt", "decrypt"],
	);
};

export const encryptAesGcm = async (
	plaintext: Uint8Array,
	key: CryptoKey,
): Promise<AesGcmEnvelope> => {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv,
		},
		key,
		plaintext,
	);

	return {
		alg: "AES-GCM",
		v: 1,
		iv: bytesToBase64Url(iv),
		ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
	};
};

export const decryptAesGcm = async (
	envelope: AesGcmEnvelope,
	key: CryptoKey,
): Promise<Uint8Array> => {
	if (envelope.alg !== "AES-GCM" || envelope.v !== 1) {
		throw new Error("Unsupported AES-GCM envelope");
	}

	const plaintext = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: base64UrlToBytes(envelope.iv),
		},
		key,
		base64UrlToBytes(envelope.ciphertext),
	);

	return new Uint8Array(plaintext);
};

export const encryptJsonAesGcm = async (
	value: unknown,
	key: CryptoKey,
): Promise<AesGcmEnvelope> => {
	return encryptAesGcm(encoder.encode(JSON.stringify(value)), key);
};

export const decryptJsonAesGcm = async <T>(
	envelope: AesGcmEnvelope,
	key: CryptoKey,
): Promise<T> => {
	const plaintext = await decryptAesGcm(envelope, key);
	return JSON.parse(decoder.decode(plaintext)) as T;
};
