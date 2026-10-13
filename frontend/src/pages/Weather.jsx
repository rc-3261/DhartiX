import { useEffect, useState } from 'react'
import {
  Cloud, CloudLightning, CloudRain, Droplets, Sun, Thermometer, Wind,
} from 'lucide-react'

import { api } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import PageHeader from '../components/PageHeader'
import ChartCard from '../components/ChartCard'
import DashboardCard from '../components/DashboardCard'
import { formatDate } from '../utils/helpers'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const conditionIcon = (cond) => {
  const c = (cond || '').toLowerCase()
  if (c.includes('rain')) return CloudRain
  if (c.includes('thunder')) return CloudLightning
  if (c.includes('cloud')) return Cloud
  if (c.includes('sun') || c.includes('clear')) return Sun
  return Cloud
}

export default function Weather() {
  const [current, setCurrent] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = location ? { location } : {}
      const [cur, fc] = await Promise.all([api.currentWeather(params), api.weatherForecast({ ...params, days: 5 })])
      setCurrent(cur.data)
      setForecast(fc.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load weather data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <LoadingSpinner full />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const Icon = conditionIcon(current?.condition)

  return (
    <div>
      <PageHeader
        title="Weather"
        subtitle={`Current conditions for ${current?.location || 'your location'}`}
        action={
          <div className="flex gap-2">
            <input
              className="input !w-56"
              placeholder="Enter location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <button onClick={load} className="btn-primary">Search</button>
          </div>
        }
      />

      <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary-800 to-primary-900 p-6 text-white">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-200">Now in {current?.location}</p>
            <div className="mt-1 flex items-center gap-2">
              <Icon className="h-10 w-10 text-primary-200" />
              <span className="text-5xl font-bold">{current?.temperature}°C</span>
            </div>
            <p className="mt-1 text-sm text-primary-100">{current?.condition}</p>
            <p className="mt-1 text-xs text-primary-300">Source: {current?.source === 'openweathermap' ? 'OpenWeatherMap' : 'Demo data'}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <Droplets className="mx-auto mb-1 h-5 w-5" />
              <p className="text-xl font-bold">{current?.humidity}%</p>
              <p className="text-[10px] text-primary-200">Humidity</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <Thermometer className="mx-auto mb-1 h-5 w-5" />
              <p className="text-xl font-bold">{current?.temperature}°</p>
              <p className="text-[10px] text-primary-200">Temp</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <Wind className="mx-auto mb-1 h-5 w-5" />
              <p className="text-xl font-bold">{current?.wind_speed}</p>
              <p className="text-[10px] text-primary-200">Wind km/h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard icon={Droplets} label="Humidity" value={`${current?.humidity}%`} color="blue" />
        <DashboardCard icon={CloudRain} label="Rain probability" value={`${current?.rain_probability ?? '-'}%`} color="purple" />
        <DashboardCard icon={Wind} label="Wind speed" value={`${current?.wind_speed} km/h`} color="gray" />
      </div>

      <div className="mt-6">
        <ChartCard title="5-day forecast" subtitle="Temperature and rain probability">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast?.forecast || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => `${v}`} labelFormatter={(d) => formatDate(d)} />
              <Bar dataKey="temperature" name="Temperature °C" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rain_probability" name="Rain %" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(forecast?.forecast || []).map((d) => {
          const FIcon = conditionIcon(d.condition)
          return (
            <div key={d.date} className="card text-center">
              <p className="text-xs font-medium text-gray-500">{formatDate(d.date)}</p>
              <FIcon className="mx-auto my-2 h-6 w-6 text-primary-600" />
              <p className="text-lg font-bold text-gray-800">{d.temperature}°C</p>
              <p className="text-xs text-gray-500">{d.condition}</p>
              <p className="mt-1 text-[10px] text-blue-600">☂ {d.rain_probability}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}