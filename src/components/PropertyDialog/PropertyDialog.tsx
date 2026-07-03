import { secondaryActionClass } from "@/common/uiClasses"
import { PropertyCard } from "@/components/PropertyCard/PropertyCard"
import type { PropertyDialogProps } from "@/components/PropertyDialog/types"

export function PropertyDialog({ property, close }: PropertyDialogProps) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-violet-950/55 p-5 backdrop-blur-sm">
      <section
        className="grid animate-[app-enter_220ms_ease-out] justify-items-center gap-4"
        role="dialog"
        aria-modal="true"
        aria-label={property.name}
      >
        <PropertyCard property={property} />
        <button type="button" className={secondaryActionClass} onClick={close}>
          Close
        </button>
      </section>
    </div>
  )
}
