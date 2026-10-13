import { useState } from 'react'
import { AlertTriangle, Beaker, Droplets, Sparkles } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'

const CROPS = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Tomato', 'Potato', 'Chickpea', 'Mustard', 'Banana', 'Onion']
const SOILS = ['ALLUVIAL', 'BLACK', 'RED', 'LATERITE', 'SANDY', 'CLAY', 'LOAMY', 'SALINE']

export default function Irrigation() {
  const [tab, setTab] = useState('irrigation')
  const [form, setForm] = useState({
    crop: 'Tomato',
    soil_moisture: '',
    temperature: '',
    crop_stage: 'VEGETATIVE',
    soil_type: 'LOAMY',
    nitrogen: '', phosphorus: '', potassium: '',
    last_irrigation: '',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    const isIrr = tab === 'irrigation'
    try {
      const payload = isIrr
        ? {
            crop: form.crop,
            soil_moisture: form.soil_moisture,
            temperature: form.temperature,
            last_irrigation: form.last_irrigation,
            crop_stage: form.crop_stage,
          }
        : {
            crop: form.crop,
            crop_stage: form.crop_stage,
            soil_type: form.soil_type,
            soil_moisture: form.soil_moisture,
            nitrogen: form.nitrogen,
            phosphorus: form.phosphorus,
            potassium: form.potassium,
          }
      const res = isIrr ? await api.irrigationRecommendation(payload) : await api.fertilizerRecommendation(payload)
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
        title="Irrigation & Fertilizer Advisor"
        subtitle="Get watering and nutrient guidance for your crops"
        action={<span className="badge bg-primary-50 text-primary-700"><Sparkles className="h-3.5 w-3.5" /> AI powered</span>}
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setTab('irrigation'); setResult(null); setError('') }}
          className={`badge cursor-pointer ${tab === 'irrigation' ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <Droplets className="h-3.5 w-3.5" /> Irrigation
        </button>
        <button
          onClick={() => { setTab('fertilizer'); setResult(null); setError('') }}
          className={`badge cursor-pointer ${tab === 'fertilizer' ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <Beaker className="h-3.5 w-3.5" /> Fertilizer
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-gray-800">
            {tab === 'irrigation' ? 'Field conditions' : 'Crop & soil details'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <FormInput label="Crop" type="select" value={form.crop} onChange={(e) => update('crop', e.target.value)} required>
              {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormInput>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Soil moisture (%)" type="number" min="0" max="100" value={form.soil_moisture} onChange={(e) => update('soil_moisture', e.target.value)} required sub="From your moisture sensor" />
              <FormInput label="Temperature (°C)" type="number" value={form.temperature} onChange={(e) => update('temperature', e.target.value)} />
            </div>
            <FormInput label="Crop stage" type="select" value={form.crop_stage} onChange={(e) => update('crop_stage', e.target.value)}>
              <option value="GERMINATION">Germination</option>
              <option value="SEEDLING">Seedling</option>
              <option value="VEGETATIVE">Vegetative</option>
              <option value="FLOWERING">Flowering</option>
              <option value="FRUITING">Fruiting</option>
              <option value="MATURITY">Maturity</option>
            </FormInput>
            {tab === 'irrigation' && (
              <FormInput label="Last irrigation (e.g. 2 days ago)" value={form.last_irrigation} onChange={(e) => update('last_irrigation', e.target.value)} />
            )}
            {tab === 'fertilizer' && (
              <>
                <FormInput label="Soil type" type="select" value={form.soil_type} onChange={(e) => update('soil_type', e.target.value)}>
                  {SOILS.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormInput>
                <div className="grid grid-cols-3 gap-3">
                  <FormInput label="N (kg/ha)" type="number" value={form.nitrogen} onChange={(e) => update('nitrogen', e.target.value)} />
                  <FormInput label="P (kg/ha)" type="number" value={form.phosphorus} onChange={(e) => update('phosphorus', e.target.value)} />
                  <FormInput label="K (kg/ha)" type="number" value={form.potassium} onChange={(e) => update('potassium', e.target.value)} />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Analyzing…' : tab === 'irrigation' ? 'Get irrigation advice' : 'Get fertilizer plan'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3">
          {loading && <LoadingSpinner full label="Analyzing…" />}
          {result && tab === 'irrigation' && (
            <div className="space-y-4">
              <div className="card flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Irrigation status</p>
                  <p className="text-xl font-bold text-gray-900">{result.status_label}</p>
                </div>
                <StatusBadge status={result.irrigation_status} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="card">
                  <p className="text-xs text-gray-500">Soil moisture</p>
                  <p className="text-lg font-bold text-gray-800">{result.current_soil_moisture ?? '-'}%</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500">Temperature</p>
                  <p className="text-lg font-bold text-gray-800">{result.temperature ?? '-'}°C</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500">Est. daily water need</p>
                  <p className="text-lg font-bold text-gray-800">{result.estimated_daily_water_mm != null ? `${result.estimated_daily_water_mm} mm` : '-'}</p>
                </div>
              </div>
              <div className="card">
                <h3 className="mb-2 font-semibold text-gray-800">Recommended action</h3>
                <p className="text-sm text-gray-700">{result.recommended_irrigation}</p>
                <p className="mt-3 text-xs text-gray-500">Last irrigation: {result.last_irrigation} • Source: {result.source}</p>
              </div>
            </div>
          )}
          {result && tab === 'fertilizer' && (
            <div className="space-y-4">
              <div className="card bg-gradient-to-br from-primary-800 to-primary-900 text-white">
                <p className="text-xs uppercase tracking-wide text-primary-200">Recommended fertilizer category</p>
                <p className="mt-1 text-2xl font-bold">{result.category}</p>
                <p className="text-sm text-primary-100">{result.crop_stage} stage • {result.soil_type} soil</p>
              </div>
              <div className="card">
                <h3 className="mb-2 font-semibold text-gray-800">Why this formula</h3>
                <p className="text-sm text-gray-700">{result.reason}</p>
              </div>
              <div className="card">
                <h3 className="mb-2 font-semibold text-gray-800">Application guidance</h3>
                <p className="text-sm text-gray-700">{result.guidance}</p>
              </div>
              {result.warnings?.length > 0 && (
                <div className="card border-amber-200 bg-amber-50">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" /> Precautions</h3>
                  <ul className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800"><span>•</span><span>{w}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!result && !loading && (
            <div className="card flex h-full flex-col items-center justify-center py-16 text-center">
              {tab === 'irrigation' ? <Droplets className="h-12 w-12 text-gray-300" /> : <Beaker className="h-12 w-12 text-gray-300" />}
              <p className="mt-3 text-sm text-gray-500">
                {tab === 'irrigation' ? 'Enter your field conditions to receive watering advice.' : 'Enter crop details to receive a fertilizer plan.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}