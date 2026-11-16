export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="state" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
