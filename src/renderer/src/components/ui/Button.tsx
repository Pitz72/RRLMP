import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            ref={ref}
            className={cn("bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors", sizeClasses[size], className)}
            {...props}
        />
    );
});
