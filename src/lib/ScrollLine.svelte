<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { IMargin, TTransition } from './types.js';

	export let viewport: Element;
	export let contents: Element;
	export let hideAfter = 1000;
	export let alwaysVisible = false;
	export let initiallyVisible = false;
	export let margin: IMargin = {};

	export let fadeIn: TTransition = (node) => fade(node, { duration: 100 });
	export let fadeOut: TTransition = (node) => fade(node, { duration: 300 });

	const dispatch = createEventDispatcher<{
		hide: null;
		show: null;
	}>();

	let startTop = 0;
	let startY = 0;

	let startLeft = 0;
	let startX = 0;

	let trackXActive = false;
	let trackYActive = false;

	let timer = 0;
	let windowScrollEnabled = false;
	let interacted = false;

	$: viewport && setupViewport(viewport);
	$: contents && setupContents(contents);

	$: marginTop = margin.top ?? 0;
	$: marginBottom = margin.bottom ?? 0;
	$: marginRight = margin.right ?? 0;
	$: marginLeft = margin.left ?? 0;

	$: wholeHeight = viewport?.scrollHeight ?? 0;
	$: scrollTop = viewport?.scrollTop ?? 0;
	$: trackHeight = viewport?.clientHeight ?? 0 - (marginTop + marginBottom);

	$: thumbHeight = wholeHeight > 0 ? (trackHeight / wholeHeight) * trackHeight : 0;
	$: thumbTop = wholeHeight > 0 ? (scrollTop / wholeHeight) * trackHeight : 0;

	$: wholeWidth = viewport?.scrollWidth ?? 0;
	$: scrollLeft = viewport?.scrollLeft ?? 0;
	$: trackWidth = viewport?.clientWidth - (marginLeft + marginRight) ?? 0;

	$: thumbWidth = wholeWidth > 0 ? (trackWidth / wholeWidth) * trackWidth : 0;
	$: thumbLeft = wholeWidth > 0 ? (scrollLeft / wholeWidth) * trackWidth : 0;

	$: scrollableY = wholeHeight > trackHeight;
	$: visibleY = scrollableY && (alwaysVisible || initiallyVisible);

	$: scrollableX = wholeWidth > trackWidth;
	$: visibleX = scrollableX && (alwaysVisible || initiallyVisible);

	const setupViewport = (viewport: Element) => {
		if (!viewport) return;
		if (typeof window.ResizeObserver === 'undefined') {
			throw new Error('window.ResizeObserver is missing.');
		}

		windowScrollEnabled = document.scrollingElement === viewport;

		const element = windowScrollEnabled ? document : viewport;
		const observer = new ResizeObserver((entries) => {
			for (const _entry of entries) {
				wholeHeight = viewport?.scrollHeight ?? 0;
				wholeWidth = viewport?.scrollWidth ?? 0;
				trackHeight = viewport?.clientHeight - (marginTop + marginBottom) ?? 0;
				trackWidth = viewport?.clientWidth - (marginLeft + marginRight) ?? 0;
			}
		});

		element.addEventListener('scroll', onScroll, { passive: true });

		observer.observe(viewport);

		return () => {
			element.removeEventListener('scroll', onScroll);
			observer.unobserve(contents);
			observer.disconnect();
		};
	};

	const setupContents = (contents: Element) => {
		if (!contents) return;

		if (typeof window.ResizeObserver === 'undefined') {
			throw new Error('window.ResizeObserver is missing.');
		}

		const observer = new ResizeObserver((entries) => {
			for (const _entry of entries) {
				wholeHeight = viewport?.scrollHeight ?? 0;
				wholeWidth = viewport?.scrollWidth ?? 0;
			}
		});

		observer.observe(contents);

		return () => {
			observer.unobserve(contents);
			observer.disconnect();
		};
	};

	const setupTimer = () => {
		timer = window.setTimeout(() => {
			visibleY = (scrollableY && (alwaysVisible || (initiallyVisible && !interacted))) || false;
			visibleX = (scrollableX && (alwaysVisible || (initiallyVisible && !interacted))) || false;
			dispatch('hide');
		}, hideAfter);
	};

	const clearTimer = () => {
		if (timer) {
			window.clearTimeout(timer);
			timer = 0;
		}
	};

	const onScroll = () => {
		clearTimer();
		setupTimer();

		if (scrollableX) {
			visibleX = alwaysVisible || (initiallyVisible && !interacted) || true;
		}
		if (scrollableY) {
			visibleY = alwaysVisible || (initiallyVisible && !interacted) || true;
		}

		scrollTop = viewport?.scrollTop ?? 0;
		scrollLeft = viewport?.scrollLeft ?? 0;

		interacted = true;

		dispatch('show');
	};

	const onTrackEnter = () => {
		clearTimer();
	};

	const onTrackLeave = () => {
		clearTimer();
		setupTimer();
	};

	const onThumbYDown = (event: MouseEvent | TouchEvent) => {
		const isDevice = event instanceof TouchEvent;

		startTop = viewport.scrollTop;
		startY = isDevice ? event.changedTouches[0].clientY : event.clientY;
		trackYActive = true;
	};

	const onThumbXDown = (event: MouseEvent | TouchEvent) => {
		const isDevice = event instanceof TouchEvent;

		startLeft = viewport.scrollLeft;
		startX = isDevice ? event.changedTouches[0].clientX : event.clientX;
		trackXActive = true;
	};

	const onThumbMove = (event: MouseEvent) => {
		const isDevice = event instanceof TouchEvent;

		if (trackYActive) {
			const clientY = isDevice ? event.changedTouches[0].clientY : event.clientY;
			const ratio = wholeHeight / trackHeight;

			viewport.scrollTop = startTop + ratio * (clientY - startY);
		}

		if (trackXActive) {
			const clientX = isDevice ? event.changedTouches[0].clientX : event.clientX;
			const ratio = wholeWidth / trackWidth;

			viewport.scrollLeft = startLeft + ratio * (clientX - startX);
		}
	};

	const onThumbUp = () => {
		startTop = 0;
		startY = 0;
		startLeft = 0;
		startX = 0;
		trackXActive = false;
		trackYActive = false;
	};

	const marginStyles = `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`;

	onMount(() => {
		viewport = viewport ?? document.scrollingElement;
		contents = contents ?? document.body;
	});
</script>

<svelte:document
	on:mousemove|preventDefault|stopPropagation={onThumbMove}
	on:touchmove|preventDefault|stopPropagation={onThumbMove}
	on:mouseup|preventDefault|stopPropagation={onThumbUp}
	on:touchend|preventDefault|stopPropagation={onThumbUp}
/>

{#if visibleY}
	<div
		class="scrollbar scrollbar-y"
		class:fix={windowScrollEnabled}
		style:height={trackHeight + 'px'}
		style:margin={marginStyles}
		aria-orientation="vertical"
	>
		<div
			role="none"
			class="track"
			on:mouseenter={onTrackEnter}
			on:mouseleave={onTrackLeave}
			in:fadeIn|local
			out:fadeOut|local
		/>
		<div
			role="none"
			class="thumb thumb-y"
			on:mousedown|preventDefault|stopPropagation={onThumbYDown}
			on:touchstart|preventDefault|stopPropagation={onThumbYDown}
			style:height={thumbHeight + 'px'}
			style:top={thumbTop + 'px'}
			in:fadeIn|local
			out:fadeOut|local
		/>
	</div>
{/if}
{#if visibleX}
	<div
		class="scrollbar scrollbar-x"
		aria-orientation="horizontal"
		class:fix={windowScrollEnabled}
		style:width={trackWidth + 'px'}
		style:margin={marginStyles}
	>
		<div
			role="none"
			class="track"
			on:mouseenter={onTrackEnter}
			on:mouseleave={onTrackLeave}
			in:fadeIn|local
			out:fadeOut|local
		/>
		<div
			role="none"
			class="thumb thumb-x"
			on:mousedown|preventDefault|stopPropagation={onThumbXDown}
			on:touchstart|preventDefault|stopPropagation={onThumbXDown}
			style:width={thumbWidth + 'px'}
			style:left={thumbLeft + 'px'}
			in:fadeIn|local
			out:fadeOut|local
		/>
	</div>
{/if}

<style lang="postcss">
	.scrollbar {
		position: absolute;
		display: flex;
	}

	.scrollbar-y {
		justify-content: center;
		top: 0;
		right: 0;
		width: var(--svrollbar-track-width, 10px);
	}

	.scrollbar-x {
		align-items: center;
		bottom: 0;
		left: 0;
		height: var(--svrollbar-track-width, 10px);
	}

	.scrollbar.fix {
		position: fixed;
	}

	.track {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 100%;
		border-radius: var(--scroll-track-radius, initial);
		opacity: var(--scroll-track-opacity, 1);
		background: var(--scroll-track-background, initial);
		box-shadow: var(--scroll-track-shadow, initial);
	}

	.thumb {
		position: relative;
		border-radius: var(--scroll-thumb-radius, 0.25rem);
		opacity: var(--scroll-thumb-opacity, 0.5);
		background: var(--scroll-thumb-background, gray);
		box-shadow: var(--scroll-thumb-shadow, initial);
	}

	.thumb-x {
		height: var(--scroll-thumb-width, 6px);
	}

	.thumb-y {
		width: var(--scroll-thumb-width, 6px);
	}
</style>
