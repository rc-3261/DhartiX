export default function FormInput({ label, name, type = 'text', error, sub, ...props }) {
  return (
    <div>
      {label && <label htmlFor={name} className="label">{label}</label>}
      {type === 'textarea' ? (
        <textarea id={name} name={name} className="input min-h-[90px]" {...props} />
      ) : type === 'select' ? (
        <select id={name} name={name} className="input" {...props} />
      ) : (
        <input id={name} name={name} type={type} className="input" {...props} />
      )}
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}