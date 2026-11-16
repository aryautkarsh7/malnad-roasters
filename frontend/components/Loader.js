import { LogoMark } from "./Logo";

export default function Loader({ message = "Loading", slow = false, page = false }) {
  return (
    <div className={`loader${page ? " loader-page" : ""}`} role="status" aria-live="polite">
      <div className="loader-mark">
        <LogoMark size={48} />
      </div>
      <p>{message}</p>
      {slow && (
        <p className="small">This is taking longer than usual. The server may be waking up, please wait.</p>
      )}
    </div>
  );
}
