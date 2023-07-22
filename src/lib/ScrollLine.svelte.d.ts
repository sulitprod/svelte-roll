import { SvelteComponentTyped } from "svelte";
import type { IMargin, TTransition } from './types.js';
declare const __propDef: {
    props: {
        viewport: Element;
        contents: Element;
        hideAfter?: number | undefined;
        alwaysVisible?: boolean | undefined;
        initiallyVisible?: boolean | undefined;
        margin?: IMargin | undefined;
        fadeIn?: TTransition | undefined;
        fadeOut?: TTransition | undefined;
    };
    events: {
        hide: CustomEvent<any>;
        show: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ScrollLineProps = typeof __propDef.props;
export type ScrollLineEvents = typeof __propDef.events;
export type ScrollLineSlots = typeof __propDef.slots;
export default class ScrollLine extends SvelteComponentTyped<ScrollLineProps, ScrollLineEvents, ScrollLineSlots> {
}
export {};
