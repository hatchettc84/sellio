import { validateAdditionalInfo, validateBasicInfo, validateCTA, ValidationErrors } from "@/lib/type"
import { CtaTypeEnum } from "@prisma/client"
import { create } from "zustand"

export type WebinarFormState = {
  basicInfo: {
    webinarName?: string
    description?: string
    date?: Date
    time?: string
    timeFormat?: "AM" | "PM"
  }
  cta: {
    ctaLabel?: string
    tags?: string[]
    ctaType: CtaTypeEnum
    aiAgent?: string
    priceId?: string
  }
  additionalInfo: {
    lockChat?: boolean
    couponCode?: string
    couponEnabled?: boolean
  }
  script: {
    content?: string
    datasetIds?: string[]
    isGenerated?: boolean
  }
}

type ValidationState = {
  basicInfo: {
    valid: boolean
    errors: ValidationErrors
  }
  cta: {
    valid: boolean
    errors: ValidationErrors
  }
  additionalInfo: {
    valid: boolean
    errors: ValidationErrors
  }
  script: {
    valid: boolean
    errors: ValidationErrors
  }
}

type WebinarStore = {
  isModalOpen: boolean
  isComplete: boolean
  isSubmitting: boolean
  formData: WebinarFormState
  validation: ValidationState

  // UI state setters
  setModalOpen: (open: boolean) => void
  setComplete: (complete: boolean) => void
  setSubmitting: (submitting: boolean) => void

  // Form field updaters
  updateBasicInfoField: <K extends keyof WebinarFormState["basicInfo"]>(
    field: K,
    value: WebinarFormState["basicInfo"][K],
  ) => void

  updateCTAField: <K extends keyof WebinarFormState["cta"]>(field: K, value: WebinarFormState["cta"][K]) => void

  updateAdditionalInfoField: <K extends keyof WebinarFormState["additionalInfo"]>(
    field: K,
    value: WebinarFormState["additionalInfo"][K],
  ) => void

  updateScriptField: <K extends keyof WebinarFormState["script"]>(
    field: K,
    value: WebinarFormState["script"][K],
  ) => void

  // Tag management
  addTag: (tag: string) => void
  removeTag: (tag: string) => void

  // Form validation
  validateStep: (stepId: keyof WebinarFormState) => boolean
  getStepValidationErrors: (stepId: keyof WebinarFormState) => ValidationErrors

  // Form reset
  resetForm: () => void
}

const initialState: WebinarFormState = {
  basicInfo: {
    webinarName: "",
    description: "",
    date: undefined,
    time: "",
    timeFormat: "AM",
  },
  cta: {
    ctaLabel: "",
    tags: [],
    ctaType: "BOOK_A_CALL",
    aiAgent: "",
    priceId:""
  },
  additionalInfo: {
    lockChat: false,
    couponCode: "",
    couponEnabled: false,
  },
  script: {
    content: "",
    datasetIds: [],
    isGenerated: false,
  },
}

const initialValidation: ValidationState = {
  basicInfo: { valid: false, errors: {} },
  cta: { valid: false, errors: {} },
  additionalInfo: { valid: true, errors: {} }, // Additional info is optional by default
  script: { valid: true, errors: {} }, // Script is optional but recommended
}

export const useWebinarStore = create<WebinarStore>((set, get) => ({
  isModalOpen: false,
  isComplete: false,
  isSubmitting: false,
  formData: initialState,
  validation: initialValidation,

  // UI state setters
  setModalOpen: (open) => set({ isModalOpen: open }),
  setComplete: (complete) => set({ isComplete: complete }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  // Form field updaters
  updateBasicInfoField: (field, value) => {
    set((state) => {
      const newBasicInfo = {
        ...state.formData.basicInfo,
        [field]: value,
      }

      const validationResult = validateBasicInfo(newBasicInfo)

      return {
        formData: {
          ...state.formData,
          basicInfo: newBasicInfo,
        },
        validation: {
          ...state.validation,
          basicInfo: validationResult,
        },
      }
    })
  },

  updateCTAField: (field, value) => {
    set((state) => {
      const newCTA = {
        ...state.formData.cta,
        [field]: value,
      }

      const validationResult = validateCTA(newCTA)

      return {
        formData: {
          ...state.formData,
          cta: newCTA,
        },
        validation: {
          ...state.validation,
          cta: validationResult,
        },
      }
    })
  },

  updateAdditionalInfoField: (field, value) => {
    set((state) => {
      const newAdditionalInfo = {
        ...state.formData.additionalInfo,
        [field]: value,
      }

      const validationResult = validateAdditionalInfo(newAdditionalInfo)

      return {
        formData: {
          ...state.formData,
          additionalInfo: newAdditionalInfo,
        },
        validation: {
          ...state.validation,
          additionalInfo: validationResult,
        },
      }
    })
  },

  updateScriptField: (field, value) => {
    set((state) => {
      const newScript = {
        ...state.formData.script,
        [field]: value,
      }

      return {
        formData: {
          ...state.formData,
          script: newScript,
        },
      }
    })
  },

  // Tag management
  addTag: (tag) => {
    set((state) => {
      const newTags = [...(state.formData.cta.tags || []), tag]
      const newCTA = {
        ...state.formData.cta,
        tags: newTags,
      }

      return {
        formData: {
          ...state.formData,
          cta: newCTA,
        },
      }
    })
  },

  removeTag: (tagToRemove) => {
    set((state) => {
      const newTags = (state.formData.cta.tags || []).filter((tag) => tag !== tagToRemove)
      const newCTA = {
        ...state.formData.cta,
        tags: newTags,
      }

      return {
        formData: {
          ...state.formData,
          cta: newCTA,
        },
      }
    })
  },

  validateStep: (stepId) => {
    const { formData } = get()

    let validationResult
    switch (stepId) {
      case "basicInfo":
        validationResult = validateBasicInfo(formData.basicInfo)
        break
      case "cta":
        validationResult = validateCTA(formData.cta)
        break
      case "additionalInfo":
        validationResult = validateAdditionalInfo(formData.additionalInfo)
        break
      case "script":
        // Script validation - optional but recommended
        validationResult = {
          valid: true,
          errors: formData.script.content?.trim() ? {} : { content: "Script is recommended for better AI agent performance" },
        }
        break
    }

    set((state) => ({
      validation: {
        ...state.validation,
        [stepId]: validationResult,
      },
    }))

    return validationResult.valid
  },

  getStepValidationErrors: (stepId) => {
    return get().validation[stepId].errors
  },

  resetForm: () =>
    set({
      isComplete: false,
      isSubmitting: false,
      formData: initialState,
      validation: initialValidation,
    }),
}))

