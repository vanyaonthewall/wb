import { Layout, LayoutRaw, ShapeType, EntryPosition, StoragePosition } from './types';

// Spec mapping used:
// Shape: Based on provided table (К->Square, Г->Horizontal, В->Vertical)
// Dimensions: Width (Front) x Depth (Side)
// Storage Mapping:
// "Левая / Верх" -> Left Top
// "Правая / Верх" -> Right Top
// "Фронтальная / Лево" -> Top Left
// "Фронтальная / Право" -> Top Right
// "Фронтальная / Центр" -> Top Center

const rawData: LayoutRaw[] = [
  { id: 1, area: 16, shape: 'Square', entry: 'Right', storage: 'Left Top', width: 4.0, depth: 4.0 },
  { id: 2, area: 16, shape: 'Square', entry: 'Right', storage: 'Left Top', width: 4.0, depth: 4.0 },
  { id: 3, area: 16, shape: 'Square', entry: 'Right', storage: 'Left Top', width: 4.0, depth: 4.0 },
  { id: 4, area: 16, shape: 'Square', entry: 'Left', storage: 'Right Top', width: 4.0, depth: 4.0 }, // Правая / Верх -> Right Top
  { id: 5, area: 15, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 3.0 },
  { id: 6, area: 15, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 3.0 },
  { id: 7, area: 15, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 5.0, depth: 3.0 },
  { id: 8, area: 15, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 5.0, depth: 3.0 },
  { id: 9, area: 15, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 5.0, depth: 3.0 },
  { id: 10, area: 18, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 6.0, depth: 3.0 },
  { id: 11, area: 20, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 4.0 },
  { id: 12, area: 20, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 4.0 },
  { id: 13, area: 20, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 5.0, depth: 4.0 },
  { id: 14, area: 20, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 4.0 },
  { id: 15, area: 20, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 4.0 },
  { id: 16, area: 12, shape: 'Vertical', entry: 'Right', storage: 'Left Top', width: 3.0, depth: 4.0 },
  { id: 17, area: 12, shape: 'Vertical', entry: 'Left', storage: 'Top Left', width: 3.0, depth: 4.0 },
  { id: 18, area: 15, shape: 'Vertical', entry: 'Right', storage: 'Top Right', width: 3.0, depth: 5.0 },
  { id: 19, area: 20, shape: 'Vertical', entry: 'Left', storage: 'Top Left', width: 4.0, depth: 5.0 },
  { id: 20, area: 20, shape: 'Vertical', entry: 'Left', storage: 'Top Center', width: 4.0, depth: 5.0 },
  { id: 21, area: 20, shape: 'Vertical', entry: 'Left', storage: 'Top Right', width: 4.0, depth: 5.0 },
  { id: 22, area: 25, shape: 'Square', entry: 'Right', storage: 'Left Center', width: 5.0, depth: 5.0 }, // Левая / Центр -> Left Center
  { id: 23, area: 25, shape: 'Square', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 5.0 },
  { id: 24, area: 25, shape: 'Square', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 5.0 },
  { id: 25, area: 25, shape: 'Square', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 5.0 },
  { id: 26, area: 25, shape: 'Square', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 5.0 },
  { id: 27, area: 25, shape: 'Square', entry: 'Right', storage: 'Top Left', width: 5.0, depth: 5.0 },
  { id: 28, area: 25, shape: 'Square', entry: 'Right', storage: 'Top Left', width: 5.0, depth: 5.0 },
  { id: 29, area: 25, shape: 'Square', entry: 'Left', storage: 'Top Right', width: 5.0, depth: 5.0 },
  { id: 30, area: 21, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 7.0, depth: 3.0 },
  { id: 31, area: 24, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 8.0, depth: 3.0 },
  { id: 32, area: 24, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 6.0, depth: 4.0 },
  { id: 33, area: 24, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 6.0, depth: 4.0 },
  { id: 34, area: 24, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 6.0, depth: 4.0 },
  { id: 35, area: 24, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 6.0, depth: 4.0 },
  { id: 36, area: 28, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 7.0, depth: 4.0 },
  { id: 37, area: 28, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 7.0, depth: 4.0 },
  { id: 38, area: 28, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 7.0, depth: 4.0 },
  { id: 39, area: 30, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 6.0, depth: 5.0 },
  { id: 40, area: 30, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 6.0, depth: 5.0 },
  { id: 41, area: 30, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 6.0, depth: 5.0 },
  { id: 42, area: 30, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 6.0, depth: 5.0 },
  { id: 43, area: 21, shape: 'Vertical', entry: 'Left', storage: 'Top Right', width: 3.0, depth: 7.0 }, // 3.0 x 7.0
  { id: 44, area: 28, shape: 'Vertical', entry: 'Left', storage: 'Top Right', width: 4.0, depth: 7.0 },
  { id: 45, area: 28, shape: 'Vertical', entry: 'Left', storage: 'Top Right', width: 4.0, depth: 7.0 },
  { id: 46, area: 30, shape: 'Vertical', entry: 'Left', storage: 'Top Left', width: 5.0, depth: 6.0 },
  { id: 47, area: 30, shape: 'Vertical', entry: 'Right', storage: 'Top Left', width: 5.0, depth: 6.0 },
  { id: 48, area: 30, shape: 'Vertical', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 6.0 },
  { id: 49, area: 30, shape: 'Vertical', entry: 'Right', storage: 'Top Left', width: 5.0, depth: 6.0 },
  { id: 50, area: 30, shape: 'Vertical', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 6.0 },
  { id: 51, area: 30, shape: 'Vertical', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 6.0 },
  { id: 52, area: 30, shape: 'Vertical', entry: 'Right', storage: 'Top Right', width: 5.0, depth: 6.0 },
  { id: 53, area: 30, shape: 'Vertical', entry: 'Left', storage: 'Top Right', width: 5.0, depth: 6.0 },
  { id: 54, area: 36, shape: 'Square', entry: 'Left', storage: 'Top Left', width: 6.0, depth: 6.0 },
  { id: 55, area: 36, shape: 'Square', entry: 'Left', storage: 'Top Left', width: 6.0, depth: 6.0 },
  { id: 56, area: 36, shape: 'Square', entry: 'Left', storage: 'Top Left', width: 6.0, depth: 6.0 },
  { id: 57, area: 36, shape: 'Square', entry: 'Left', storage: 'Top Right', width: 6.0, depth: 6.0 },
  { id: 58, area: 36, shape: 'Square', entry: 'Left', storage: 'Top Right', width: 6.0, depth: 6.0 },
  { id: 59, area: 36, shape: 'Square', entry: 'Right', storage: 'Top Right', width: 6.0, depth: 6.0 },
  { id: 60, area: 32, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 8.0, depth: 4.0 },
  { id: 61, area: 35, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 7.0, depth: 5.0 },
  { id: 62, area: 35, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 7.0, depth: 5.0 },
  { id: 63, area: 36, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 9.0, depth: 4.0 },
  { id: 64, area: 40, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 8.0, depth: 5.0 },
  { id: 65, area: 36, shape: 'Vertical', entry: 'Right', storage: 'Top Left', width: 4.0, depth: 9.0 },
  { id: 66, area: 42, shape: 'Horizontal', entry: 'Center', storage: 'Top Left', width: 7.0, depth: 6.0 },
  { id: 67, area: 42, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 7.0, depth: 6.0 },
  { id: 68, area: 45, shape: 'Horizontal', entry: 'Right', storage: 'Top Left', width: 9.0, depth: 5.0 },
  { id: 69, area: 48, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 8.0, depth: 6.0 },
  { id: 70, area: 48, shape: 'Horizontal', entry: 'Left', storage: 'Top Right', width: 8.0, depth: 6.0 },
  { id: 71, area: 54, shape: 'Horizontal', entry: 'Left', storage: 'Top Left', width: 9.0, depth: 6.0 },
  { id: 72, area: 63, shape: 'Horizontal', entry: 'Right', storage: 'Top Right', width: 9.0, depth: 7.0 },
  { id: 73, area: 63, shape: 'Horizontal', entry: 'Left', storage: 'Right Center', width: 9.0, depth: 7.0 },
  { id: 74, area: 42, shape: 'Vertical', entry: 'Center', storage: 'Top Right', width: 6.0, depth: 7.0 }
];

// Mirroring Logic
const mirrorEntry = (pos: EntryPosition): EntryPosition => {
  if (pos === 'Left') return 'Right';
  if (pos === 'Right') return 'Left';
  return 'Center';
};

const mirrorStorage = (pos: StoragePosition): StoragePosition => {
  // Horizontal flip logic
  const map: Record<StoragePosition, StoragePosition> = {
    'Top Left': 'Top Right',
    'Top Center': 'Top Center',
    'Top Right': 'Top Left',
    'Left Top': 'Right Top',
    'Left Center': 'Right Center',
    'Left Bottom': 'Right Bottom',
    'Right Top': 'Left Top',
    'Right Center': 'Left Center',
    'Right Bottom': 'Left Bottom'
  };
  return map[pos];
};

export const getLayouts = (): Layout[] => {
  const layouts: Layout[] = [];
  
  rawData.forEach(item => {
    // Original
    layouts.push({
      ...item,
      isMirrored: false,
      originalId: item.id
    });
    
    // Mirrored
    // Note: Dimensions (width/depth) do not change when mirrored horizontally.
    layouts.push({
      id: 1000 + item.id, // Offset ID for mirrored
      area: item.area,
      shape: item.shape,
      entry: mirrorEntry(item.entry),
      storage: mirrorStorage(item.storage),
      width: item.width,
      depth: item.depth,
      isMirrored: true,
      originalId: item.id
    });
  });

  return layouts;
};

// Available Filter Options for UI
export const ENTRY_OPTIONS: EntryPosition[] = ['Left', 'Center', 'Right'];

export const STORAGE_OPTIONS = [
  { id: 'Top Left', group: 'Top', label: 'Сверху слева' },
  { id: 'Top Center', group: 'Top', label: 'Сверху по центру' },
  { id: 'Top Right', group: 'Top', label: 'Сверху справа' },
  { id: 'Right Top', group: 'Right', label: 'Справа сверху' },
  { id: 'Right Center', group: 'Right', label: 'Справа по центру' },
  { id: 'Right Bottom', group: 'Right', label: 'Справа снизу' },
  { id: 'Left Top', group: 'Left', label: 'Слева сверху' },
  { id: 'Left Center', group: 'Left', label: 'Слева по центру' },
  { id: 'Left Bottom', group: 'Left', label: 'Слева снизу' },
] as const;