import { Leaf, Sprout, Droplets } from 'lucide-react'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-900 p-10 text-white lg:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-700/30" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-primary-600/20" />
        <div className="relative flex items-center gap-3">
          <img src="/leaf.svg" alt="DhartiX" className="h-10 w-10 rounded-xl" />
          <div>
            <p className="text-2xl font-bold">DhartiX</p>
            <p className="text-xs text-primary-200">AgroBusiness 4.0</p>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl font-bold leading-snug">
            Smart Agricultural Management System
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-primary-100">
            Manage your farms, monitor IoT sensors, get AI-powered farming suggestions and sell
            your produce directly to buyers - all in one connected platform.
          </p>
          <div className="grid max-w-md grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-primary-800/50 p-3">
              <Sprout className="mx-auto mb-1 h-5 w-5 text-primary-300" />
              <p className="text-[10px] text-primary-100">Farm &amp; Crop</p>
            </div>
            <div className="rounded-xl bg-primary-800/50 p-3">
              <Droplets className="mx-auto mb-1 h-5 w-5 text-primary-300" />
              <p className="text-[10px] text-primary-100">IoT Monitoring</p>
            </div>
            <div className="rounded-xl bg-primary-800/50 p-3">
              <Leaf className="mx-auto mb-1 h-5 w-5 text-primary-300" />
              <p className="text-[10px] text-primary-100">AI Suggestions</p>
            </div>
          </div>
        </div>
        <p className="relative text-[11px] text-primary-300">
          © 2026 DhartiX • Python Django • React • MySQL
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <img src="/leaf.svg" alt="DhartiX" className="h-9 w-9 rounded-lg" />
            <div>
              <p className="text-lg font-bold text-gray-900">DhartiX</p>
              <p className="text-[10px] text-gray-500">AgroBusiness 4.0</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}