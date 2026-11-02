import { FitText } from './FitText';
import { label, meter, value } from './theme';

export function Balance({ value: balance }: { value: number }) {
  return (
    <div style={meter}>
      <span style={label}>Balance</span>
      <span style={value}>
        <FitText text={balance.toFixed(2)} />
      </span>
    </div>
  );
}
