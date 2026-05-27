import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionResultLike = {
	[index: number]: { transcript: string };
	isFinal: boolean;
};

type SpeechRecognitionEventLike = {
	results: {
		length: number;
		[index: number]: SpeechRecognitionResultLike;
	};
};

type SpeechRecognitionLike = {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onend: (() => void) | null;
	onerror: (() => void) | null;
	onresult: ((event: SpeechRecognitionEventLike) => void) | null;
	start: () => void;
	stop: () => void;
};

type SpeechWindow = Window & {
	SpeechRecognition?: SpeechRecognitionConstructor;
	webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function useSpeechInput(onText: (text: string) => void) {
	const [isListening, setIsListening] = useState(false);
	const [isSupported, setIsSupported] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionLike | undefined>(undefined);

	const SpeechRecognition = useMemo(() => {
		if (typeof window === "undefined") {
			return undefined;
		}
		const speechWindow = window as SpeechWindow;
		return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
	}, []);

	useEffect(() => {
		setIsSupported(Boolean(SpeechRecognition));
	}, [SpeechRecognition]);

	const start = () => {
		if (!SpeechRecognition || isListening) {
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "ko-KR";
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.onresult = (event) => {
			let finalText = "";
			for (let index = 0; index < event.results.length; index += 1) {
				const result = event.results[index];
				if (result?.isFinal) {
					finalText += result[0]?.transcript ?? "";
				}
			}
			if (finalText.trim()) {
				onText(finalText.trim());
			}
		};
		recognition.onerror = () => setIsListening(false);
		recognition.onend = () => setIsListening(false);
		recognitionRef.current = recognition;
		setIsListening(true);
		recognition.start();
	};

	const stop = () => {
		recognitionRef.current?.stop();
		setIsListening(false);
	};

	return {
		isListening,
		isSupported,
		start,
		stop,
	};
}
