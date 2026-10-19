import { Logo, LogoMark } from '@/components/brand/Logo'

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#121212] animate-fade-in">
      <div className="flex items-center gap-3 mb-4 animate-pulse">
        <LogoMark size={40} />
        <Logo size="2xl" />
      </div>
      <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full w-1/2 rounded-full bg-[#0078D4] animate-[progress_1s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}
