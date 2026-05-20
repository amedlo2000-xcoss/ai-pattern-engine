const STEPS = [
  { id: 1, label: 'アイテム選択' },
  { id: 2, label: 'デザイン入力' },
  { id: 3, label: 'AI解析中' },
  { id: 4, label: '型紙完成' },
]

export default function StepProgress({ currentStep }) {
  const items = []
  STEPS.forEach((step, i) => {
    const isActive = currentStep === step.id
    const isDone   = currentStep > step.id
    items.push(
      <div key={step.id} className="step-item">
        <div className={`step-node${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
          {isDone ? '✓' : step.id}
        </div>
        <span className={`step-label${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
          {step.label}
        </span>
      </div>
    )
    if (i < STEPS.length - 1) {
      items.push(
        <div key={`c${step.id}`} className={`step-connector${currentStep > step.id ? ' done' : ''}`} />
      )
    }
  })

  return (
    <div className="step-progress glass-panel">
      <div className="step-track">{items}</div>
      {currentStep === 3 && (
        <div className="step-loading-bar">
          <div className="step-loading-fill" />
        </div>
      )}
    </div>
  )
}
