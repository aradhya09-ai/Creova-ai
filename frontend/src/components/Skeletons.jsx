import { motion } from 'framer-motion'

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function ImageSkeleton({ className = '' }) {
  return <Skeleton className={`aspect-square ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="panel p-4">
      <Skeleton className="mb-3 aspect-video w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}