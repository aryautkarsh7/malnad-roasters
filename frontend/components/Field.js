export default function Field({ label, name, value, onChange, error, hint, type = "text", textarea = false, ...rest }) {
  const Tag = textarea ? "textarea" : "input";
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <Tag
        id={name}
        name={name}
        type={textarea ? undefined : type}
        value={value}
        onChange={onChange}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <p className="error" id={`${name}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
