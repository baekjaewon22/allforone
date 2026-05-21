declare module "vanta/dist/vanta.net.min" {
	import type * as THREE from "three";

	type VantaNetOptions = {
		el: HTMLElement;
		THREE: typeof THREE;
		mouseControls?: boolean;
		touchControls?: boolean;
		gyroControls?: boolean;
		minHeight?: number;
		minWidth?: number;
		scale?: number;
		scaleMobile?: number;
		color?: number;
		backgroundColor?: number;
		points?: number;
		maxDistance?: number;
		spacing?: number;
		showDots?: boolean;
	};

	export default function NET(options: VantaNetOptions): { destroy: () => void };
}
