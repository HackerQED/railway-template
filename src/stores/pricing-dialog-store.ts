import { create } from 'zustand';

interface PricingDialogState {
  open: boolean;
  openPricingDialog: () => void;
  closePricingDialog: () => void;
}

export const usePricingDialogStore = create<PricingDialogState>((set) => ({
  open: false,
  openPricingDialog: () => set({ open: true }),
  closePricingDialog: () => set({ open: false }),
}));
