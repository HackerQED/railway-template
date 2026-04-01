'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Context 用于传递 onItemClick 回调
type AccordionContextValue = {
	onItemClick?: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue>({});

// Accordion 根组件
interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
	type?: 'single' | 'multiple'; // 保留 prop 以兼容现有代码，但不实际使用
	collapsible?: boolean; // 保留 prop 以兼容现有代码，但不实际使用
	value?: string; // 保留 prop 以兼容现有代码，但不实际使用
	onValueChange?: (value: string) => void; // 用作 onItemClick 的别名
	defaultValue?: string; // 保留 prop 以兼容现有代码，但不实际使用
}

function Accordion({
	className,
	children,
	onValueChange,
	type,
	collapsible,
	value,
	defaultValue,
	...props
}: AccordionProps) {
	return (
		<AccordionContext.Provider value={{ onItemClick: onValueChange }}>
			<div data-slot="accordion" className={className} {...props}>
				{children}
			</div>
		</AccordionContext.Provider>
	);
}

// AccordionItem - 渲染 <details>
interface AccordionItemProps extends React.HTMLAttributes<HTMLElement> {
	value?: string;
}

function AccordionItem({
	value,
	className,
	children,
	...props
}: AccordionItemProps) {
	const context = React.useContext(AccordionContext);

	const handleToggle = () => {
		// 当 item 被点击时，通知外部
		if (value && context.onItemClick) {
			context.onItemClick(value);
		}
	};

	return (
		<details
			data-slot="accordion-item"
			className={cn('group border-b last:border-b-0', className)}
			onToggle={handleToggle}
			{...props}
		>
			{children}
		</details>
	);
}

// AccordionTrigger - 渲染 <summary>
interface AccordionTriggerProps extends React.HTMLAttributes<HTMLElement> {}

function AccordionTrigger({
	className,
	children,
	...props
}: AccordionTriggerProps) {
	return (
		<summary
			data-slot="accordion-trigger"
			className={cn(
				'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] [&::-webkit-details-marker]:hidden cursor-pointer list-none',
				className,
			)}
			{...props}
		>
			{children}
			<ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200 group-open:rotate-180" />
		</summary>
	);
}

// AccordionContent - 直接渲染内容
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function AccordionContent({
	className,
	children,
	...props
}: AccordionContentProps) {
	return (
		<div
			data-slot="accordion-content"
			className={cn('pt-0 pb-4 text-sm', className)}
			{...props}
		>
			{children}
		</div>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
