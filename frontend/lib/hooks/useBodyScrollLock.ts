"use client";

import { useEffect, useLayoutEffect } from "react";

// Use layout effect if possible
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type BodyStyleSnapshot = {
	overflow: string;
	paddingRight: string;
};

let activeLocks = 0;
let snapshot: BodyStyleSnapshot | null = null;

const applyBodyLock = () => {
	if (typeof window === "undefined") {
		return;
	}

	const body = document.body;
	if (!body) {
		return;
	}

	if (activeLocks === 0) {
		// Calculate scrollbar width
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		
		snapshot = {
			overflow: body.style.overflow,
			paddingRight: body.style.paddingRight,
		};

		body.style.overflow = "hidden";
		if (scrollbarWidth > 0) {
			body.style.paddingRight = `${scrollbarWidth}px`;
		}
	}

	activeLocks += 1;
};

const releaseBodyLock = () => {
	if (typeof window === "undefined") {
		return;
	}

	const body = document.body;
	if (!body || activeLocks === 0) {
		return;
	}

	activeLocks -= 1;
	if (activeLocks > 0) {
		return;
	}

	if (snapshot) {
		body.style.overflow = snapshot.overflow;
		body.style.paddingRight = snapshot.paddingRight;
		snapshot = null;
	}
};

export function useBodyScrollLock(locked: boolean): void {
	useIsomorphicLayoutEffect(() => {
		if (!locked) {
			return;
		}

		applyBodyLock();
		return () => {
			releaseBodyLock();
		};
	}, [locked]);
}
