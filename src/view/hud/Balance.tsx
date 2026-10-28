export function Balance({ value }: { value: number }) {
  return (
    <div className="meter">
      <span className="label">Balance</span>
      <span className="value">{value.toFixed(2)}</span>
    </div>
  );
}
