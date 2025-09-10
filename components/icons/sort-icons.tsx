import { HTMLAttributes } from 'react'

interface SortIconProps extends HTMLAttributes<SVGElement> {
  size?: number
  className?: string
}

export const SortAscIcon = ({ size = 48, className = '', ...props }: SortIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: `${size}px`, height: `${size}px` }}
    {...props}
  >
    <path d="m3 16 4 4 4-4"/>
    <path d="M7 4v16"/>
    <path d="M15 4h5l-5 6h5"/>
    <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20"/>
    <path d="M20 18h-5"/>
  </svg>
)

export const SortDescIcon = ({ size = 48, className = '', ...props }: SortIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: `${size}px`, height: `${size}px` }}
    {...props}
  >
    <path d="m3 16 4 4 4-4"/>
    <path d="M7 20V4"/>
    <path d="M20 8h-5"/>
    <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10"/>
    <path d="M15 14h5l-5 6h5"/>
  </svg>
)