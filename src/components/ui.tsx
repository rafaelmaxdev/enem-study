// Button adapted from shadcn/ui (MIT); native controls keep the personal app small.
import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva,type VariantProps} from 'class-variance-authority';
import {clsx,type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
export const cn=(...values:ClassValue[])=>twMerge(clsx(values));
const buttonVariants=cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]',{variants:{variant:{default:'bg-primary text-primary-foreground hover:opacity-90',outline:'border border-border bg-card hover:bg-muted',ghost:'hover:bg-muted'},size:{default:'min-h-10 px-4 py-2',sm:'min-h-9 px-3 py-1.5',icon:'size-10'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,asChild=false,...props}:React.ComponentProps<'button'>&VariantProps<typeof buttonVariants>&{asChild?:boolean}){const Comp=asChild?Slot:'button';return <Comp data-slot="button" className={cn(buttonVariants({variant,size}),className)} {...props}/>;}
export function Card({className,...props}:React.ComponentProps<'section'>){return <section data-slot="card" className={cn('rounded-2xl border border-border bg-card',className)} {...props}/>;}
export function Select({label,children,...props}:React.ComponentProps<'select'>&{label:string}){return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;}
