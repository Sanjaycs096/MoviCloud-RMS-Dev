// Centralized Button System with All States
// Import this in components that need consistent button behavior

import { cn } from "@/app/components/ui/utils";

export const buttonStyles = {
  // Base button styles with all states
  base: "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  
  // Height standards
  heights: {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-6 text-base",  // Standard height
    lg: "h-12 px-8 text-lg",
  },
  
  // Primary action (right side)
  primary: "bg-[#8B5A2B] text-white hover:bg-[#6D421E] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus-visible:ring-[#8B5A2B]",
  
  // Secondary action (left side)
  secondary: "bg-white text-[#8B5A2B] border-2 border-[#8B5A2B] hover:bg-[#F5F1ED] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
  
  // Destructive action (separated, red)
  destructive: "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus-visible:ring-red-600",
  
  // Success state
  success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg",
  
  // Disabled state
  disabled: "opacity-50 cursor-not-allowed pointer-events-none bg-gray-300 text-gray-500",
  
  // Ghost button
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 active:bg-gray-200",
  
  // Outline button
  outline: "border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
};

// Button spacing in modals
export const modalButtonLayout = {
  container: "flex gap-3 pt-6",
  leftButton: "flex-1", // Secondary
  rightButton: "flex-1", // Primary
  destructiveSeparate: "ml-auto", // Separated destructive action
};

// Pressed state animation
export const pressedAnimation = "active:scale-[0.98] active:shadow-inner";

// Usage example:
// <button className={cn(buttonStyles.base, buttonStyles.heights.md, buttonStyles.primary, pressedAnimation)}>
//   Save Changes
// </button>
