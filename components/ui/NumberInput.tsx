import React, { useState, useEffect, useRef } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  onChange, 
  min, 
  max, 
  className, 
  ...props 
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref to track if we just focused, to handle the click-select behavior
  const justFocused = useRef(false);

  useEffect(() => {
    // Only sync from parent if we are NOT the active element
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow digits only
    if (!/^\d*$/.test(rawValue)) return;

    setLocalValue(rawValue);

    if (rawValue !== '') {
      onChange(Number(rawValue));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let finalVal = localValue === '' ? (min ?? value) : Number(localValue);
    
    if (min !== undefined && finalVal < min) finalVal = min;
    if (max !== undefined && finalVal > max) finalVal = max;

    setLocalValue(finalVal.toString());
    onChange(finalVal);
    
    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    justFocused.current = true;
    e.target.select();
    props.onFocus?.(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    // If this mouseup is part of the focus event sequence (click -> focus -> mouseup),
    // prevent the default behavior (placing cursor) so the selection remains.
    if (justFocused.current) {
      e.preventDefault();
      justFocused.current = false;
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseUp={handleMouseUp}
      className={className}
      {...props}
    />
  );
};

export default NumberInput;