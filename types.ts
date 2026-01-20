export type ShapeType = 'Horizontal' | 'Vertical' | 'Square';

export type EntryPosition = 'Left' | 'Center' | 'Right';

// Storage positions relative to the main view (Entry is always at Bottom conceptually)
export type StoragePosition = 
  | 'Top Left' | 'Top Center' | 'Top Right'
  | 'Left Top' | 'Left Center' | 'Left Bottom'
  | 'Right Top' | 'Right Center' | 'Right Bottom';

export interface LayoutRaw {
  id: number;
  area: number;
  shape: ShapeType;
  entry: EntryPosition; // Assuming Entry is on the "Bottom" wall
  storage: StoragePosition;
  width: number; // Frontal wall length (meters)
  depth: number; // Right wall length (meters)
}

export interface Layout extends LayoutRaw {
  isMirrored: boolean;
  originalId: number;
}

export interface FilterState {
  areaRange: [number, number];
  shape: ShapeType | null;
  entry: EntryPosition | null;
  storage: StoragePosition | null;
}

export const SHAPES: { value: ShapeType; label: string }[] = [
  { value: 'Square', label: 'Квадрат' },
  { value: 'Horizontal', label: 'Горизонтальная' },
  { value: 'Vertical', label: 'Вертикальная' },
];