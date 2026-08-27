import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode
} from "react";
import { Link } from "react-router-dom";
import {
  Controller,
  useForm,
  type FieldError,
  type FieldErrors,
  type UseFormRegisterReturn
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiAuth } from "../hooks/useApiAuth";
import UniversalDropdown, {
  type DropdownOption
} from "../components/UI/UniversalDropdown";

import {
  createServiceRequest,
  getServiceCategory,
  getServiceLocations,
  uploadServiceRequestsImages,
  type LookUpItem,
  type ServiceRequestCreated
} from "../Services/serviceRequestService";
import {
  getCustomerProfile,
  type CustomerAddress
} from "../Services/customerProfileService";
import ActionButton from "../components/UI/ActionButton";
import { useShopSettings } from "../hooks/useShopSettings";

const bookingSchema = z
  .object({
    customerName: z.string().min(1, "Name is required"),

    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number is too long"),

    email: z.string().email("Enter a valid email").optional().or(z.literal("")),

    serviceCategoryId: z.number().min(1, "Select service category"),

    serviceLocationId: z.number().optional(),

    deviceName: z.string().optional(),
    brand: z.string().optional(),
    modelName: z.string().optional(),

    issueDescription: z.string().min(5, "Please describe the issue"),

    serviceType: z.enum(["Home Visit", "Shop Repair"], {
      message: "Select service type"
    }),

    visitAddress: z.string().optional(),

    preferredDate: z.string().optional(),
    preferredTimeSlot: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.serviceType === "Home Visit") {
      if (!data.serviceLocationId || data.serviceLocationId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serviceLocationId"],
          message: "Select service location"
        });
      }

      if (!data.visitAddress || data.visitAddress.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visitAddress"],
          message: "Visit address is required for home visit"
        });
      }
    }
  });

type BookingFormData = z.infer<typeof bookingSchema>;

const fieldScrollOrder: Array<keyof BookingFormData> = [
  "customerName",
  "phoneNumber",
  "email",
  "serviceCategoryId",
  "serviceLocationId",
  "deviceName",
  "brand",
  "modelName",
  "issueDescription",
  "serviceType",
  "visitAddress",
  "preferredDate",
  "preferredTimeSlot"
];

function getFirstErrorField(errors: FieldErrors<BookingFormData>) {
  return fieldScrollOrder.find((fieldName) => Boolean(errors[fieldName]));
}

type ServiceType = "Home Visit" | "Shop Repair";

type PreferredTimeSlot = "Morning" | "Afternoon" | "Evening";

const serviceTypeOptions: DropdownOption<ServiceType>[] = [
  {
    value: "Home Visit",
    label: "Home Visit"
  },
  {
    value: "Shop Repair",
    label: "Shop Repair"
  }
];

const preferredTimeOptions: DropdownOption<PreferredTimeSlot>[] = [
  {
    value: "Morning",
    label: "Morning — 9 AM to 12 PM"
  },
  {
    value: "Afternoon",
    label: "Afternoon — 12 PM to 4 PM"
  },
  {
    value: "Evening",
    label: "Evening — 4 PM to 7 PM"
  }
];

function BookRepairPage() {
  const [categories, setCategories] = useState<LookUpItem[]>([]);
  const [locations, setLocations] = useState<LookUpItem[]>([]);

  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [successResult, setSuccessResult] =
    useState<ServiceRequestCreated | null>(null);

  const successSectionRef = useRef<HTMLDivElement | null>(null);

  const [selectedImages, setSelectedImage] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string>("");

  const { isLoaded, isSignedIn, getToken } = useApiAuth();

  const { settings } = useShopSettings();

  const primaryPhone = getTelHref(settings.primaryPhone);

  useEffect(() => {
    if (!successResult) return;

    const timer = window.setTimeout(() => {
      successSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [successResult]);

  useEffect(() => {
    document.title = `Book Repair | ${settings.shopName}`;

    return () => {
      document.title = `${settings.shopName}`;
    };
  });

  const [apiError, setApiError] = useState<string>("");
  const [defaultVisitAddress, setDefaultVisitAddress] = useState<string>("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      email: "",
      serviceType: "Home Visit",
      serviceCategoryId: 0,
      serviceLocationId: 0,
      deviceName: "",
      brand: "",
      modelName: "",
      issueDescription: "",
      visitAddress: "",
      preferredDate: "",
      preferredTimeSlot: ""
    }
  });

  const selectedCategoryId = watch("serviceCategoryId");
  const selectedLocationId = watch("serviceLocationId");
  const selectedServiceType = watch("serviceType");
  const deviceName = watch("deviceName");
  const preferredDate = watch("preferredDate");
  const preferredTimeSlot = watch("preferredTimeSlot");

  const categoryOptions = useMemo<DropdownOption<number>[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name
      })),
    [categories]
  );

  useEffect(() => {
    if (selectedCategoryId <= 0) return;

    const category = categories.find((item) => item.id === selectedCategoryId);
    const isTvRepairCategory = category?.name
      .toLowerCase()
      .includes("tv repair");

    if (!isTvRepairCategory && selectedServiceType === "Home Visit") {
      setValue("serviceType", "Shop Repair", { shouldValidate: true });
    }
  }, [selectedCategoryId, categories, selectedServiceType, setValue]);

  const availableServiceTypeOptions = useMemo<
    DropdownOption<ServiceType>[]
  >(() => {
    const category = categories.find((item) => item.id === selectedCategoryId);
    const isTvRepairCategory =
      category?.name.toLowerCase().includes("tv repair") ?? true;

    return isTvRepairCategory
      ? serviceTypeOptions
      : serviceTypeOptions.filter((option) => option.value === "Shop Repair");
  }, [categories, selectedCategoryId]);

  const locationOptions = useMemo<DropdownOption<number>[]>(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: location.name
      })),
    [locations]
  );
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId)?.name ??
    "Not selected";

  const selectedLocation =
    selectedServiceType === "Shop Repair"
      ? "Not required"
      : (locations.find((location) => location.id === selectedLocationId)
          ?.name ?? "Not selected");
  useEffect(() => {
    async function loadLookups() {
      try {
        setLoadingLookups(true);
        setApiError("");

        const [categoryData, locationData] = await Promise.all([
          getServiceCategory(),
          getServiceLocations()
        ]);

        setCategories(categoryData);
        setLocations(locationData);
      } catch {
        setApiError("Failed to load booking options.");
      } finally {
        setLoadingLookups(false);
      }
    }

    loadLookups();
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    setImageError("");

    if (files.length === 0) {
      return;
    }

    if (selectedImages.length >= maxImages) {
      setImageError(`Maximum ${maxImages} images are allowed.`);
      event.target.value = "";
      return;
    }

    const availableSlots = maxImages - selectedImages.length;
    const filesToAdd = files.slice(0, availableSlots);

    const imageValidationError = validateSelectedImages([
      ...selectedImages,
      ...filesToAdd
    ]);

    if (imageValidationError) {
      setImageError(imageValidationError);
      event.target.value = "";
      return;
    }

    if (files.length > availableSlots) {
      setImageError(
        `Only ${maxImages} photos are allowed. Extra images were ignored.`
      );
    }

    setSelectedImage((currentImages) => {
      const newImages = [...currentImages, ...filesToAdd];

      const uniqueImages = newImages.filter(
        (image, index, self) =>
          index ===
          self.findIndex(
            (item) =>
              item.name === image.name &&
              item.size === image.size &&
              item.lastModified === image.lastModified
          )
      );

      return uniqueImages.slice(0, maxImages);
    });

    event.target.value = "";
  }

  function removeSelectedImage(fileName: string, fileSize: number) {
    setImageError("");

    setSelectedImage((currentImages) =>
      currentImages.filter(
        (image) => !(image.name === fileName && image.size === fileSize)
      )
    );
  }

  function formatAddress(address: CustomerAddress) {
    return [address.addressLine, address.city, address.state, address.pincode]
      .filter(Boolean)
      .join(", ");
  }
  useEffect(() => {
    async function autoFillCustomerProfile() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const profile = await getCustomerProfile(token);

        setValue("customerName", profile.fullName || "", {
          shouldDirty: false
        });

        setValue("phoneNumber", profile.phoneNumber || "", {
          shouldDirty: false
        });

        setValue("email", profile.email || "", {
          shouldDirty: false
        });

        const defaultAddress =
          profile.addresses.find((address) => address.isDefault) ||
          profile.addresses[0];

        if (defaultAddress) {
          const formattedAddress = formatAddress(defaultAddress);

          setDefaultVisitAddress(formattedAddress);

          setValue("visitAddress", formattedAddress, {
            shouldDirty: false
          });
        }
      } catch {}
    }

    autoFillCustomerProfile();
  }, [isLoaded, isSignedIn, getToken, setValue]);

  useEffect(() => {
    if (selectedServiceType === "Shop Repair") {
      setValue("serviceLocationId", 0, {
        shouldValidate: true
      });

      setValue("visitAddress", "", {
        shouldValidate: true
      });
    }

    if (selectedServiceType === "Home Visit" && defaultVisitAddress) {
      setValue("visitAddress", defaultVisitAddress, {
        shouldValidate: true
      });
    }
  }, [selectedServiceType, defaultVisitAddress, setValue]);

  function handleInvalidSubmit(formErrors: FieldErrors<BookingFormData>) {
    const firstErrorField = getFirstErrorField(formErrors);

    if (!firstErrorField) {
      return;
    }

    const fieldElement = document.querySelector<HTMLElement>(
      `[data-field-name="${firstErrorField}"]`
    );

    fieldElement?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    const focusableElement = fieldElement?.querySelector<HTMLElement>(
      "input, textarea, button, [tabindex]:not([tabindex='-1'])"
    );

    window.setTimeout(() => {
      focusableElement?.focus();
    }, 350);
  }

  async function onSubmit(data: BookingFormData) {
    try {
      setSubmitting(true);
      setApiError("");
      setSuccessResult(null);
      setImageError("");

      const token = isSignedIn ? await getToken() : null;
      const imageValidationError = validateSelectedImages(selectedImages);
      if (imageValidationError) {
        setImageError(imageValidationError);
        return;
      }

      const result = await createServiceRequest(
        {
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          email: data.email || undefined,

          serviceCategoryId: data.serviceCategoryId,
          serviceLocationId:
            data.serviceType === "Home Visit"
              ? data.serviceLocationId
              : undefined,

          deviceName: data.deviceName || undefined,
          brand: data.brand || undefined,
          modelName: data.modelName || undefined,

          issueDescription: data.issueDescription,

          serviceType: data.serviceType,
          visitAddress:
            data.serviceType === "Home Visit" ? data.visitAddress : undefined,

          preferredDate: data.preferredDate || undefined,
          preferredTimeSlot: data.preferredTimeSlot || undefined
        },
        token
      );

      if (selectedImages.length > 0) {
        await uploadServiceRequestsImages(
          result.serviceRequestId,
          selectedImages
        );
      }

      setSuccessResult(result);

      reset({
        customerName: "",
        phoneNumber: "",
        email: "",
        serviceType: "Home Visit",
        serviceCategoryId: 0,
        serviceLocationId: 0,
        deviceName: "",
        brand: "",
        modelName: "",
        issueDescription: "",
        visitAddress: "",
        preferredDate: "",
        preferredTimeSlot: ""
      });

      setSelectedImage([]);
      setImageError("");
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("Failed to create service request.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-clip bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="te-sheet-bg border-b border-[#d8cdb6] bg-[#f7f5ef] dark:border-[#302c24] dark:bg-[#11110f]">
        <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-8 sm:py-12 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Repair booking
              </p>

              <h1 className="font-display mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Book a repair request
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093] sm:text-base">
                Add your device problem, contact details and preferred service
                type.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/track-request"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
              >
                Track existing request
              </Link>

              <a
                href={primaryPhone}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
              >
                Call shop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="mx-auto grid w-full max-w-[1720px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px] lg:px-12 xl:px-16 2xl:px-20 lg:py-16">
        <section className="min-w-0">
          <div className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
            <div className="border-b border-[#d8cdb6] pb-5 dark:border-[#302c24]">
              <h2 className="text-2xl font-black tracking-tight">
                Repair details
              </h2>

              <p className="mt-2 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Fields marked with{" "}
                <span className="text-red-500 dark:text-red-400">*</span> are
                required.
              </p>
            </div>

            {loadingLookups ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
                <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  Loading booking form...
                </p>
              </div>
            ) : (
              <form
                className="mt-6 space-y-6"
                onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
              >
                <FormSection title="Contact information">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Full name"
                      required
                      placeholder="Enter your name"
                      registration={register("customerName")}
                      error={errors.customerName}
                    />

                    <TextInput
                      label="Phone number"
                      required
                      placeholder="9999999999"
                      registration={register("phoneNumber")}
                      error={errors.phoneNumber}
                    />
                  </div>

                  <TextInput
                    label="Email"
                    placeholder="you@example.com"
                    registration={register("email")}
                    error={errors.email}
                  />
                </FormSection>

                <FormSection title="Device and issue">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div data-field-name="serviceCategoryId">
                      <Controller
                        name="serviceCategoryId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <UniversalDropdown<number>
                            label="Service category"
                            required
                            options={categoryOptions}
                            value={field.value > 0 ? field.value : null}
                            onChange={field.onChange}
                            placeholder="Select service category"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>

                    {selectedServiceType === "Home Visit" && (
                      <div data-field-name="serviceLocationId">
                        <Controller
                          name="serviceLocationId"
                          control={control}
                          render={({ field, fieldState }) => (
                            <UniversalDropdown<number>
                              label="Service area"
                              required
                              options={locationOptions}
                              value={
                                field.value && field.value > 0
                                  ? field.value
                                  : null
                              }
                              onChange={field.onChange}
                              placeholder="Select service area"
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextInput
                      label="Device"
                      placeholder="LED TV"
                      registration={register("deviceName")}
                    />

                    <TextInput
                      label="Brand"
                      placeholder="Samsung"
                      registration={register("brand")}
                    />

                    <TextInput
                      label="Model"
                      placeholder="UA32"
                      registration={register("modelName")}
                    />
                  </div>

                  <TextAreaInput
                    label="Describe the problem"
                    required
                    placeholder="Example: Display is black but sound is working."
                    registration={register("issueDescription")}
                    error={errors.issueDescription}
                    rows={4}
                  />

                  <PhotoUploadInput
                    selectedImages={selectedImages}
                    imageError={imageError}
                    onChange={handleImageChange}
                    onRemove={removeSelectedImage}
                  />
                </FormSection>

                <FormSection title="Service preference">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div data-field-name="serviceType">
                      <Controller
                        name="serviceType"
                        control={control}
                        render={({ field, fieldState }) => (
                          <UniversalDropdown<ServiceType>
                            label="Service type"
                            required
                            options={availableServiceTypeOptions}
                            value={field.value as ServiceType}
                            onChange={field.onChange}
                            placeholder="Select service type"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>

                    <TextInput
                      type="date"
                      label="Preferred date"
                      registration={register("preferredDate")}
                    />

                    <Controller
                      name="preferredTimeSlot"
                      control={control}
                      render={({ field, fieldState }) => (
                        <UniversalDropdown<PreferredTimeSlot>
                          label="Preferred time"
                          options={preferredTimeOptions}
                          value={
                            field.value
                              ? (field.value as PreferredTimeSlot)
                              : null
                          }
                          onChange={field.onChange}
                          placeholder="Select preferred time"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>

                  {selectedServiceType === "Home Visit" && (
                    <TextAreaInput
                      label="Visit address"
                      required
                      placeholder="Enter your full address"
                      registration={register("visitAddress")}
                      error={errors.visitAddress}
                      rows={3}
                    />
                  )}
                </FormSection>

                {apiError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                    {apiError}
                  </div>
                )}

                <ActionButton
                  type="submit"
                  loading={submitting}
                  loadingText=""
                  variant="dark"
                  fullWidth
                  className="h-12 cursor-pointer rounded-xl"
                >
                  Submit Repair Request
                </ActionButton>
              </form>
            )}
          </div>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            {successResult ? (
              <div ref={successSectionRef}>
                <SuccessCard successResult={successResult} />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-black">Request summary</h2>

                <div className="mt-4 space-y-2">
                  <SummaryItem label="Service" value={selectedCategory} />

                  <SummaryItem label="Type" value={selectedServiceType} />

                  {selectedServiceType === "Home Visit" && (
                    <SummaryItem label="Area" value={selectedLocation} />
                  )}

                  <SummaryItem
                    label="Device"
                    value={deviceName || "Not added"}
                  />

                  <SummaryItem
                    label="Date"
                    value={preferredDate || "Not selected"}
                  />

                  <SummaryItem
                    label="Time"
                    value={preferredTimeSlot || "Not selected"}
                  />
                </div>

                <div className="mt-5 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 text-xs font-semibold leading-5 text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
                  After submitting, save your request number to track the
                  repair.
                </div>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f] sm:p-5">
      <h3 className="text-base font-black">{title}</h3>

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({
  label,
  required = false
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
      {label}

      {required && (
        <span
          className="ml-1 font-black text-red-600 dark:text-red-400"
          aria-hidden="true"
        >
          *
        </span>
      )}

      {required && <span className="sr-only"> required</span>}
    </label>
  );
}

type TextInputProps = {
  label: string;
  placeholder?: string;
  type?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  required?: boolean;
};
function TextInput({
  label,
  placeholder,
  type = "text",
  registration,
  error,
  required = false
}: TextInputProps) {
  return (
    <div data-field-name={registration.name}>
      <FieldLabel label={label} required={required} />

      <input
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-required={required}
        className="w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#8f8778] dark:focus:border-[#d6b46a]"
        {...registration}
      />

      {error && <ErrorText message={error.message} />}
    </div>
  );
}

type TextAreaInputProps = {
  label: string;
  placeholder?: string;
  rows?: number;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  required?: boolean;
};

function TextAreaInput({
  label,
  placeholder,
  rows = 3,
  registration,
  error,
  required = false
}: TextAreaInputProps) {
  return (
    <div data-field-name={registration.name}>
      <FieldLabel label={label} required={required} />

      <textarea
        rows={rows}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-required={required}
        className="w-full resize-none rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#8f8778] dark:focus:border-[#d6b46a]"
        {...registration}
      />

      {error && <ErrorText message={error.message} />}
    </div>
  );
}

type PhotoUploadInputProps = {
  selectedImages: File[];
  imageError: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (fileName: string, fileSize: number) => void;
};

function PhotoUploadInput({
  selectedImages,
  imageError,
  onChange,
  onRemove
}: PhotoUploadInputProps) {
  const hasReachedImageLimit = selectedImages.length >= maxImages;

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        Repair Photos Optional
      </label>

      {!hasReachedImageLimit ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#d8cdb6] bg-[#fffaf0] px-4 py-8 text-center transition hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#1a1712]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onChange}
            className="hidden"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-2xl font-black text-[#7a570f] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            +
          </div>

          <p className="mt-4 text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            Upload TV / device photos
          </p>

          <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            Add up to {maxImages} photos. Each photo should be less than 5MB.
          </p>
        </label>
      ) : (
        <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fff8e7] px-4 py-6 text-center dark:border-[#302c24] dark:bg-[#11110f]">
          <p className="text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            Photo limit reached
          </p>

          <p className="mt-2 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Remove one photo to upload another image.
          </p>
        </div>
      )}

      {imageError && (
        <p className="mt-2 text-sm font-semibold text-red-500">{imageError}</p>
      )}

      {selectedImages.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedImages.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]"
            >
              <SelectedImagePreview
                file={file}
                onRemove={() => onRemove(file.name, file.size)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
type ErrorTextProps = {
  message?: string;
};

function ErrorText({ message }: ErrorTextProps) {
  return <p className="mt-2 text-sm font-semibold text-red-500">{message}</p>;
}
type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-3 dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
        {label}
      </span>
      <span className="max-w-[55%] truncate text-right text-sm font-black">
        {value}
      </span>
    </div>
  );
}

type SuccessCardProps = {
  successResult: ServiceRequestCreated;
};

function SuccessCard({ successResult }: SuccessCardProps) {
  return (
    <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
        Booking Created Successfully
      </p>

      <h3 className="mt-3 text-3xl font-black text-[#1f1a12] dark:text-[#e8e3d8]">
        {successResult.requestNumber}
      </h3>

      <p className="mt-2 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
        Status: {successResult.status}
      </p>

      <Link
        to={`/track-request?requestNumber=${encodeURIComponent(
          successResult.requestNumber
        )}`}
        className="mt-5 inline-flex rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        Track Request
      </Link>
    </div>
  );
}
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024; // 5MB
const maxImages = 5;

function validateSelectedImages(files: File[]) {
  if (files.length > maxImages) {
    return "Maximum 5 images are allowed.";
  }

  for (const file of files) {
    if (!allowedImageTypes.includes(file.type)) {
      return "Only JPG, PNG and WEBP images are allowed. SVG is not supported.";
    }

    if (file.size > maxImageSize) {
      return "Each image must be less than 5MB.";
    }
  }

  return "";
}
function SelectedImagePreview({
  file,
  onRemove
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]">
      <img
        src={previewUrl}
        alt={file.name}
        className="h-28 w-full object-cover"
      />

      <div className="p-3">
        <p className="truncate text-xs font-black">{file.name}</p>

        <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>

        <button
          type="button"
          onClick={onRemove}
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function getTelHref(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return "#";
  }

  if (digits.startsWith("91")) {
    return `tel:+${digits}`;
  }

  return `tel:+91${digits}`;
}
export default BookRepairPage;
