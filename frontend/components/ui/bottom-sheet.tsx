"use client";

import { useDragToClose } from "@/lib/hooks/useDragToClose";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { X } from "lucide-react";
import React from "react";

export interface BottomSheetProps {
	isOpen: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
}

export function BottomSheet({
	isOpen,
	onClose,
	title,
	children,
	footer,
	className = "",
}: BottomSheetProps) {
	useBodyScrollLock(isOpen);
	const sheetRef = useDragToClose<HTMLDivElement>({
		onClose,
		dragThreshold: 80,
		isOpen,
	});

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 animate-fade-in"
				onClick={onClose}
				role="dialog"
				aria-modal="true"
			/>
			{/* Drawer */}
			<div
				ref={sheetRef}
				className={`fixed bottom-0 left-1/2 z-50 flex max-h-[85dvh] w-full max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl bg-[#fff8f5] p-6 shadow-2xl animate-slide-up transition-transform ${className}`}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="w-12 h-1.5 bg-[#dcc1bb] rounded-full mx-auto mb-6 shrink-0" />
				
				<div className="flex justify-between items-center mb-6 shrink-0">
					{title && (
						<h2 className="font-aref-ruqaa text-3xl text-[#812f1d]">
							{title}
						</h2>
					)}
					<button
						onClick={onClose}
						className="p-2 bg-[#f5ece7] rounded-full text-[#55423e] hover:bg-[#e9e1dc] transition-colors mr-auto"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div
					className="flex-1 overflow-y-auto overscroll-contain mb-6 hide-scrollbar"
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{children}
				</div>

				{footer && (
					<div className="pt-4 border-t border-[#dcc1bb] shrink-0">
						{footer}
					</div>
				)}
			</div>
		</>
	);
}
