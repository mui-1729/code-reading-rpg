/** Number original source lines, not the visual rows created by responsive wrapping. */
export function SourceCode({ code, scrollable = false }: { code: string; scrollable?: boolean }) {
  return (
    <div className="source-code" role="region" aria-label="ソースコード（番号は元の行番号）" tabIndex={scrollable ? 0 : undefined}>
      {code.split('\n').map((line, index) => (
        <div className="source-code-line" key={index} data-source-line={index + 1}>
          <span className="source-line-number" aria-hidden="true">{index + 1}</span>
          <pre><code>{line}</code></pre>
        </div>
      ))}
    </div>
  )
}
