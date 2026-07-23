export type ConfirmedExpense = {
  id: string;
  receiptId: string;
  store: string;
  productName: string;
  quantity: number;
  unit: 'kg' | 'L' | '件';
  unitPriceCents: number;
  amountCents: number;
  purchasedOn: string;
  itemCount: number;
  status: 'confirmed';
};

// Synthetic, privacy-safe records used only to demonstrate the confirmed-data UI.
export const CONFIRMED_EXPENSES: ConfirmedExpense[] = [
  { id: 'line-01', receiptId: 'PKS-0723', store: "PAK'nSAVE", productName: '时令蔬果组合', quantity: 1, unit: 'kg', unitPriceCents: 499, amountCents: 499, purchasedOn: '2026-07-23', itemCount: 3, status: 'confirmed' },
  { id: 'line-02', receiptId: 'PKS-0723', store: "PAK'nSAVE", productName: '全脂牛奶', quantity: 1, unit: 'L', unitPriceCents: 625, amountCents: 625, purchasedOn: '2026-07-23', itemCount: 2, status: 'confirmed' },
  { id: 'line-03', receiptId: 'WW-0722', store: 'Woolworths', productName: '全麦面包', quantity: 1, unit: '件', unitPriceCents: 379, amountCents: 379, purchasedOn: '2026-07-22', itemCount: 1, status: 'confirmed' },
  { id: 'line-04', receiptId: 'WW-0722', store: 'Woolworths', productName: '鸡胸肉', quantity: 1, unit: 'kg', unitPriceCents: 840, amountCents: 840, purchasedOn: '2026-07-22', itemCount: 1, status: 'confirmed' },
  { id: 'line-05', receiptId: 'NW-0720', store: 'New World', productName: '气泡水', quantity: 1, unit: 'L', unitPriceCents: 565, amountCents: 565, purchasedOn: '2026-07-20', itemCount: 2, status: 'confirmed' },
  { id: 'line-06', receiptId: 'NW-0720', store: 'New World', productName: '玉米脆片', quantity: 0.5, unit: 'kg', unitPriceCents: 578, amountCents: 289, purchasedOn: '2026-07-20', itemCount: 1, status: 'confirmed' },
  { id: 'line-07', receiptId: 'PKS-0718', store: "PAK'nSAVE", productName: '洗衣液', quantity: 1, unit: 'L', unitPriceCents: 735, amountCents: 735, purchasedOn: '2026-07-18', itemCount: 1, status: 'confirmed' },
  { id: 'line-08', receiptId: 'PKS-0718', store: "PAK'nSAVE", productName: '橄榄油', quantity: 1, unit: 'L', unitPriceCents: 410, amountCents: 410, purchasedOn: '2026-07-18', itemCount: 2, status: 'confirmed' },
  { id: 'line-09', receiptId: 'FM-0716', store: 'Fresh Market', productName: '牛油果', quantity: 1, unit: 'kg', unitPriceCents: 525, amountCents: 525, purchasedOn: '2026-07-16', itemCount: 4, status: 'confirmed' },
  { id: 'line-10', receiptId: 'WW-0714', store: 'Woolworths', productName: '冷冻水饺', quantity: 1, unit: 'kg', unitPriceCents: 645, amountCents: 645, purchasedOn: '2026-07-14', itemCount: 2, status: 'confirmed' },
  { id: 'line-11', receiptId: 'WW-0714', store: 'Woolworths', productName: '洗发水', quantity: 0.5, unit: 'L', unitPriceCents: 640, amountCents: 320, purchasedOn: '2026-07-14', itemCount: 1, status: 'confirmed' },
  { id: 'line-12', receiptId: 'NW-0712', store: 'New World', productName: '三文鱼', quantity: 0.5, unit: 'kg', unitPriceCents: 1650, amountCents: 825, purchasedOn: '2026-07-12', itemCount: 1, status: 'confirmed' },
  { id: 'line-13', receiptId: 'NW-0712', store: 'New World', productName: '全脂牛奶', quantity: 2, unit: 'L', unitPriceCents: 270, amountCents: 540, purchasedOn: '2026-07-12', itemCount: 2, status: 'confirmed' },
  { id: 'line-14', receiptId: 'PKS-0710', store: "PAK'nSAVE", productName: '宠物粮', quantity: 1, unit: 'kg', unitPriceCents: 599, amountCents: 599, purchasedOn: '2026-07-10', itemCount: 1, status: 'confirmed' },
  { id: 'line-15', receiptId: 'PKS-0710', store: "PAK'nSAVE", productName: '其他商品', quantity: 1, unit: '件', unitPriceCents: 275, amountCents: 275, purchasedOn: '2026-07-10', itemCount: 1, status: 'confirmed' },
  { id: 'line-16', receiptId: 'WW-0708', store: 'Woolworths', productName: '意大利面', quantity: 2, unit: 'kg', unitPriceCents: 330, amountCents: 660, purchasedOn: '2026-07-08', itemCount: 3, status: 'confirmed' },
  { id: 'line-17', receiptId: 'WW-0708', store: 'Woolworths', productName: '果汁', quantity: 2, unit: 'L', unitPriceCents: 225, amountCents: 450, purchasedOn: '2026-07-08', itemCount: 2, status: 'confirmed' },
  { id: 'line-18', receiptId: 'FM-0706', store: 'Fresh Market', productName: '西红柿', quantity: 1, unit: 'kg', unitPriceCents: 380, amountCents: 380, purchasedOn: '2026-07-06', itemCount: 3, status: 'confirmed' },
  { id: 'line-19', receiptId: 'NW-0705', store: 'New World', productName: '冷冻莓果', quantity: 1, unit: 'kg', unitPriceCents: 610, amountCents: 610, purchasedOn: '2026-07-05', itemCount: 2, status: 'confirmed' },
  { id: 'line-20', receiptId: 'NW-0705', store: 'New World', productName: '坚果零食', quantity: 0.5, unit: 'kg', unitPriceCents: 990, amountCents: 495, purchasedOn: '2026-07-05', itemCount: 2, status: 'confirmed' },
  { id: 'line-21', receiptId: 'PKS-0703', store: "PAK'nSAVE", productName: '香料组合', quantity: 0.5, unit: 'kg', unitPriceCents: 670, amountCents: 335, purchasedOn: '2026-07-03', itemCount: 1, status: 'confirmed' },
  { id: 'line-22', receiptId: 'PKS-0701', store: "PAK'nSAVE", productName: '厨房清洁剂', quantity: 1, unit: 'L', unitPriceCents: 1333, amountCents: 1333, purchasedOn: '2026-07-01', itemCount: 2, status: 'confirmed' },
];
