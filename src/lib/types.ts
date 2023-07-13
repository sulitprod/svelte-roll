import type { FadeParams, TransitionConfig } from 'svelte/transition';

export interface IMargin {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}
export type TTransition = (node: HTMLElement, params?: FadeParams) => TransitionConfig;
