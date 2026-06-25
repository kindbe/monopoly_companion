import type { Property } from "@/domain/bidding";

export type PropertyDialogProps = {
  property: Property;
  close: () => void;
};
