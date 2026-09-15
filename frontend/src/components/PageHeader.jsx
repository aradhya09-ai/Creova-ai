import { motion } from 'framer-motion'

export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">{eyebrow}</p>}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
        {actions}
      </div>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
    </motion.div>
  )
}