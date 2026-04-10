type ReasoningStepBodyProps = {
  text: string
}

export function ReasoningStepBody({ text }: ReasoningStepBodyProps) {
  return <pre className="whitespace-pre-wrap font-sans">{text}</pre>
}
