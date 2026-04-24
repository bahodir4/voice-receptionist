import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Plus, Trash2, Building2, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type BusinessSettings as ISettings } from '@/store/adminStore'

interface Props {
  settings: ISettings | null
  isSaving: boolean
  onSave: (data: ISettings) => void
}

function Field({ label, value, onChange, placeholder, multiline = false }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  const cls = `w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600
               bg-white/[0.04] border border-white/[0.08] outline-none
               focus:border-violet-500/40 focus:bg-white/[0.06] transition-all resize-none`
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {multiline
        ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  )
}

export function BusinessSettings({ settings, isSaving, onSave }: Props) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<ISettings>({
    business_name: '', business_hours: '', business_address: '',
    business_phone: '', business_email: '', business_description: '',
    custom_instructions: '', faqs: [], updated_at: null,
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  function set(key: keyof ISettings, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addFaq() {
    set('faqs', [...form.faqs, { question: '', answer: '' }])
  }

  function removeFaq(i: number) {
    set('faqs', form.faqs.filter((_, idx) => idx !== i))
  }

  function updateFaq(i: number, field: 'question' | 'answer', value: string) {
    const updated = form.faqs.map((f, idx) => idx === i ? { ...f, [field]: value } : f)
    set('faqs', updated)
  }

  async function handleSave() {
    await onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Business info */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-300">{t('admin.settings_business_info')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('admin.field_name')}    value={form.business_name}    onChange={(v) => set('business_name', v)}    placeholder="Acme Corp" />
          <Field label={t('admin.field_phone')}   value={form.business_phone}   onChange={(v) => set('business_phone', v)}   placeholder="+1 (800) 555-0000" />
          <Field label={t('admin.field_email')}   value={form.business_email}   onChange={(v) => set('business_email', v)}   placeholder="info@acme.com" />
          <Field label={t('admin.field_hours')}   value={form.business_hours}   onChange={(v) => set('business_hours', v)}   placeholder="Mon–Fri 9am–5pm EST" />
        </div>
        <Field label={t('admin.field_address')}  value={form.business_address} onChange={(v) => set('business_address', v)} placeholder="123 Main St, New York, NY" />
        <Field label={t('admin.field_about')}    value={form.business_description} onChange={(v) => set('business_description', v)} placeholder={t('admin.field_about_placeholder')} multiline />
      </div>

      {/* FAQs */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300">{t('admin.settings_faqs')}</h3>
          <motion.button
            onClick={addFaq}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                       text-slate-400 hover:text-slate-200 bg-white/[0.04] border border-white/[0.07]
                       hover:bg-white/[0.07] transition-all"
          >
            <Plus className="w-3 h-3" />
            {t('admin.add_faq')}
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {form.faqs.length === 0 && (
            <p className="text-xs text-slate-600 py-2">{t('admin.no_faqs_hint')}</p>
          )}
          {form.faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 items-start"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text" value={faq.question} placeholder={t('admin.faq_question')}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-200 placeholder-slate-600
                             bg-white/[0.04] border border-white/[0.07] outline-none
                             focus:border-violet-500/30 transition-all"
                />
                <input
                  type="text" value={faq.answer} placeholder={t('admin.faq_answer')}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-200 placeholder-slate-600
                             bg-white/[0.04] border border-white/[0.07] outline-none
                             focus:border-violet-500/30 transition-all"
                />
              </div>
              <button onClick={() => removeFaq(i)}
                className="mt-1.5 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Custom instructions */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">{t('admin.settings_instructions')}</h3>
        <Field
          label={t('admin.field_instructions')}
          value={form.custom_instructions}
          onChange={(v) => set('custom_instructions', v)}
          placeholder={t('admin.field_instructions_placeholder')}
          multiline
        />
        <p className="text-[11px] text-slate-600 mt-2">{t('admin.instructions_hint')}</p>
      </div>

      {/* Save button */}
      <motion.button
        onClick={handleSave}
        disabled={isSaving}
        whileHover={{ scale: isSaving ? 1 : 1.02 }}
        whileTap={{ scale: isSaving ? 1 : 0.97 }}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium
                   bg-violet-600/[0.18] border border-violet-500/30 text-violet-300
                   hover:bg-violet-600/[0.28] hover:border-violet-500/50
                   disabled:opacity-50 transition-all"
      >
        {saved
          ? <><Check className="w-4 h-4 text-emerald-400" />{t('admin.saved')}</>
          : isSaving
          ? <><span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />{t('admin.saving')}</>
          : <><Save className="w-4 h-4" />{t('admin.save_settings')}</>}
      </motion.button>
    </div>
  )
}
