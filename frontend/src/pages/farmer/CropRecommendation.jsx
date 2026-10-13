import { useEffect, useState } from 'react'
import { Sprout, Sparkles } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'

const blank = { soil_type: 'LOAMY', temperature: '', season: 'RABI', farm_size: '', water_availability: 'MEDIUM' }

const TIPS = [
  'Enter details and receive suggested crops with a confidence score.',
  'Based on the standard crop knowledge base built into DhartiX AI.',
  'Combine with the Fertilizer & Irrigation tools for a full advisory.',
]

export default function CropRecommendation() {
  const [form, setForm] = useState(blank)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await api.cropRecommendation(form)
      setResult(res.data)
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to get a recommendation.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Crop Recommendation"
        subtitle="AI suggests the most suitable crops for your soil & climate"
        action={<span className="badge bg-primary-50 text-primary-700"><Sparkles className="h-3.5 w-3.5" /> AI powered</span>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-gray-800">Your field conditions</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <FormInput label="Soil type" type="select" value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })}>
              <option value="ALLUVIAL">Alluvial</option>
              <option value="BLACK">Black</option>
              <option value="RED">Red</option>
              <option value="LATERITE">Laterite</option>
              <option value="SANDY">Sandy</option>
              <option value="CLAY">Clay</option>
              <option value="LOAMY">Loamy</option>
              <option value="SALINE">Saline</option>
            </FormInput>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Avg temperature (°C)" type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
              <FormInput label="Season" type="select" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                <option value="KHARIF">Kharif</option>
                <option value="RABI">Rabi</option>
                <option value="ZAID">Zaid</option>
              </FormInput>
              <FormInput label="Farm size (acres)" type="number" step="0.1" value={form.farm_size} onChange={(e) => setForm({ ...form, farm_size: e.target.value })} />
              <FormInput label="Water availability" type="select" value={form.water_availability} onChange={(e) => setForm({ ...form, water_availability: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </FormInput>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Analyzing…' : 'Get recommendations'}
            </button>
          </form>
          <div className="mt-5 space-y-2 rounded-xl bg-gray-50 p-4">
            {TIPS.map((t) => (
              <p key={t} className="flex items-start gap-2 text-xs text-gray-500">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" /> {t}
              </p>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading && <LoadingSpinner full label="Analyzing conditions…" />}
          {result && (
            <div className="space-y-4">
              {result.recommendations?.slice(0, 1).map((r) => (
                <div key={r.crop} className="card flex items-center justify-between bg-gradient-to-br from-primary-800 to-primary-900 text-white">
                  <div className="flex items-center gap-3">
                    <Sprout className="h-8 w-8 text-primary-200" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary-200">Best match</p>
                      <p className="text-2xl font-bold">{r.crop}</p>
                      <p className="text-sm text-primary-100">
                        Suitability: <span className="font-bold">{r.suitability_score}/10</span> • {r.growing_period}
                      </p>
                    </div>
                  </div>
                  <span className="badge bg-white/20 text-white capitalize">{result.source}</span>
                </div>
              ))}

              {result.recommendations?.length > 0 && (
                <div className="card">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    {result.recommendations.length > 1 ? 'All recommendations' : 'Why this crop?'}
                  </h3>
                  <div className="space-y-3">
                    {result.recommendations.map((r) => (
                      <div key={r.crop} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-800">{r.crop}</p>
                          <span className="badge bg-primary-50 text-primary-700">{r.suitability_score}/10</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">{r.reason}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Growing period: {r.growing_period} • Water: {r.water_requirement}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <h3 className="mb-2 font-semibold text-gray-800">Fertilizer guidance</h3>
                <p className="text-sm text-gray-700">{result.recommendations?.[0]?.fertilizer || 'Consult local extension officers for exact fertilizer plans.'}</p>
              </div>
            </div>
          )}
          {!result && !loading && (
            <div className="card flex h-full flex-col items-center justify-center py-16 text-center">
              <Sprout className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">Fill in your field conditions to see recommended crops.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}