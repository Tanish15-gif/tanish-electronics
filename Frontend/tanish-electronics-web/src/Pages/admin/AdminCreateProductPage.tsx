import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode
} from "react";
import { Link, useNavigate } from "react-router-dom";
import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  createAdminProduct,
  deleteAdminProduct,
  getProductCategories,
  getProductConditions,
  uploadProductImage
} from "../../Services/adminProductService";
import type { LookUpItem } from "../../Services/serviceRequestService";
import { useShopSettings } from "../../hooks/useShopSettings";

type ProductForm = {
  productCategoryId: number;
  productConditionId: number;

  productName: string;
  brand: string;
  modelName: string;
  description: string;

  price: string;
  stockQuantity: string;

  isAvailable: boolean;
  isFeatured: boolean;

  createAnnouncement: boolean;
  announcementTitle: string;
  announcementMessage: string;
  announcementPriority: number;
  announcementEndAt: string;
};

const allowedProductImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const allowedProductImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const maximumProductImageSize = 5 * 1024 * 1024;

const announcementPriorityOptions: DropdownOption<number>[] = [
  {
    value: 1,
    label: "Low priority"
  },
  {
    value: 2,
    label: "Normal priority"
  },
  {
    value: 3,
    label: "High priority"
  },
  {
    value: 4,
    label: "Urgent"
  }
];

const initialProductForm: ProductForm = {
  productCategoryId: 0,
  productConditionId: 0,

  productName: "",
  brand: "",
  modelName: "",
  description: "",

  price: "",
  stockQuantity: "1",

  isAvailable: true,
  isFeatured: false,

  createAnnouncement: false,
  announcementTitle: "",
  announcementMessage: "",
  announcementPriority: 2,
  announcementEndAt: ""
};

function validateProductImage(file: File | null) {
  if (!file) {
    return "";
  }

  const lowerFileName = file.name.toLowerCase();

  const validExtension = allowedProductImageExtensions.some((extension) =>
    lowerFileName.endsWith(extension)
  );

  if (!allowedProductImageTypes.has(file.type) || !validExtension) {
    return "Only JPG, JPEG, PNG and WEBP images are supported. SVG files are not allowed.";
  }

  if (file.size > maximumProductImageSize) {
    return "The product image must be smaller than 5MB.";
  }

  return "";
}

function AdminCreateProductPage() {
  const navigate = useNavigate();
  const { settings } = useShopSettings();
  const { getToken } = useApiAuth();

  const [categories, setCategories] = useState<LookUpItem[]>([]);
  const [conditions, setConditions] = useState<LookUpItem[]>([]);

  const [form, setForm] = useState<ProductForm>(initialProductForm);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadLookups();
  }, []);

  useEffect(() => {
    document.title = `Add Product | ${settings.shopName}`;

    return () => {
      document.title = settings.shopName;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const categoryOptions = useMemo<DropdownOption<number>[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name
      })),
    [categories]
  );

  const conditionOptions = useMemo<DropdownOption<number>[]>(
    () =>
      conditions.map((condition) => ({
        value: condition.id,
        label: condition.name
      })),
    [conditions]
  );

  const selectedCategoryName =
    categories.find((category) => category.id === form.productCategoryId)
      ?.name || "Category";

  const selectedConditionName =
    conditions.find((condition) => condition.id === form.productConditionId)
      ?.name || "Condition";

  const parsedPreviewPrice = Number(form.price);

  const previewPrice =
    form.price.trim() !== "" && Number.isFinite(parsedPreviewPrice)
      ? formatPrice(parsedPreviewPrice)
      : "₹0";

  async function loadLookups() {
    try {
      setLoading(true);
      setError("");

      const [categoryData, conditionData] = await Promise.all([
        getProductCategories(),
        getProductConditions()
      ]);

      setCategories(categoryData);
      setConditions(conditionData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load product categories and conditions."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value
    }));

    if (error) {
      setError("");
    }
  }

  function handleProductImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setImageError("");
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateProductImage(file);

    if (validationError) {
      setSelectedImage(null);
      setImagePreview("");
      setImageError(validationError);
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
  }

  function removeProductImage() {
    setSelectedImage(null);
    setImagePreview("");
    setImageError("");
  }

  function validateForm() {
    if (form.productCategoryId <= 0) {
      return "Select a product category.";
    }

    if (form.productConditionId <= 0) {
      return "Select a product condition.";
    }

    if (form.productName.trim().length < 2) {
      return "Enter a valid product name.";
    }

    const parsedPrice = Number(form.price);

    if (
      form.price.trim() === "" ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return "Enter a valid product price.";
    }

    const parsedStockQuantity = Number(form.stockQuantity);

    if (
      form.stockQuantity.trim() === "" ||
      !Number.isInteger(parsedStockQuantity) ||
      parsedStockQuantity < 0
    ) {
      return "Stock quantity must be a whole number.";
    }

    const selectedImageError = validateProductImage(selectedImage);

    if (selectedImageError) {
      setImageError(selectedImageError);
      return selectedImageError;
    }

    if (form.createAnnouncement) {
      if (form.announcementTitle.trim().length < 3) {
        return "Enter an announcement title.";
      }

      if (form.announcementMessage.trim().length < 5) {
        return "Enter an announcement message.";
      }

      if (form.announcementEndAt) {
        const selectedEndDate = new Date(form.announcementEndAt);

        if (
          Number.isNaN(selectedEndDate.getTime()) ||
          selectedEndDate <= new Date()
        ) {
          return "Announcement end time must be in the future.";
        }
      }
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    const parsedPrice = Number(form.price);

    const parsedStockQuantity = Number(form.stockQuantity);

    let createdProductId: number | null = null;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const result = await createAdminProduct(
        {
          productCategoryId: form.productCategoryId,

          productConditionId: form.productConditionId,

          productName: form.productName.trim(),

          brand: form.brand.trim() || undefined,

          modelName: form.modelName.trim() || undefined,

          description: form.description.trim() || undefined,

          price: parsedPrice,
          stockQuantity: parsedStockQuantity,

          isAvailable: form.isAvailable,
          isFeatured: form.isFeatured,

          createAnnouncement: form.createAnnouncement,

          announcementTitle: form.createAnnouncement
            ? form.announcementTitle.trim()
            : null,

          announcementMessage: form.createAnnouncement
            ? form.announcementMessage.trim()
            : null,

          announcementPriority: form.createAnnouncement
            ? form.announcementPriority
            : 2,

          announcementEndAt:
            form.createAnnouncement && form.announcementEndAt
              ? new Date(form.announcementEndAt).toISOString()
              : null
        },
        token
      );

      createdProductId = result.productId;

      if (selectedImage) {
        try {
          await uploadProductImage(result.productId, selectedImage, token);
        } catch (uploadError) {
          /*
           * The product was created before its image was
           * uploaded. Delete it again when the upload fails,
           * so an incomplete product is not left behind.
           */
          try {
            await deleteAdminProduct(result.productId, token);

            createdProductId = null;
          } catch {
            throw new Error(
              "Image upload failed and automatic cleanup also failed. Delete the incomplete product from the Products page."
            );
          }

          throw new Error(
            uploadError instanceof Error
              ? `Image upload failed: ${uploadError.message}. Product creation was rolled back.`
              : "Image upload failed. Product creation was rolled back."
          );
        }
      }

      setSuccess(result.message || "Product created successfully.");

      window.setTimeout(() => {
        navigate("/admin/products");
      }, 700);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : createdProductId
            ? "The product was created, but another operation failed."
            : "Failed to create product."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <CreateProductLoading />;
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-black text-[#8a6624] transition hover:text-[#5e4315] dark:text-[#d6b46a]"
        >
          <BackIcon />
          Products
        </Link>

        <header className="mt-5 rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
            Inventory management
          </p>

          <h1 className="font-display mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Add product
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
            Add product information, inventory, availability and an optional
            homepage announcement.
          </p>
        </header>

        {(error || success) && (
          <div id="create-product-alert" className="mt-5 space-y-3">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                {success}
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]"
        >
          <div className="min-w-0 space-y-6">
            <FormSection
              title="Product information"
              description="Basic details customers will see on the product listing."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <UniversalDropdown<number>
                  label="Product category"
                  options={categoryOptions}
                  value={form.productCategoryId || null}
                  onChange={(value) => updateField("productCategoryId", value)}
                  placeholder="Select category"
                />

                <UniversalDropdown<number>
                  label="Product condition"
                  options={conditionOptions}
                  value={form.productConditionId || null}
                  onChange={(value) => updateField("productConditionId", value)}
                  placeholder="Select condition"
                />

                <FormField label="Product name" required>
                  <input
                    value={form.productName}
                    onChange={(event) =>
                      updateField("productName", event.target.value)
                    }
                    placeholder="Example: LG 43-inch Smart TV"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="Brand">
                  <input
                    value={form.brand}
                    onChange={(event) =>
                      updateField("brand", event.target.value)
                    }
                    placeholder="Example: LG"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="Model name">
                  <input
                    value={form.modelName}
                    onChange={(event) =>
                      updateField("modelName", event.target.value)
                    }
                    placeholder="Example: 43LM5600"
                    className="admin-input"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Pricing and inventory"
              description="Set the listed price and current stock quantity."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Listed price" required>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#8a6624] dark:text-[#d6b46a]">
                      ₹
                    </span>

                    <input
                      value={form.price}
                      onChange={(event) =>
                        updateField("price", event.target.value)
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="12500"
                      className="admin-input pl-9"
                    />
                  </div>
                </FormField>

                <FormField label="Stock quantity" required>
                  <input
                    value={form.stockQuantity}
                    onChange={(event) =>
                      updateField("stockQuantity", event.target.value)
                    }
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="1"
                    className="admin-input"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Product description"
              description="Mention working condition, included accessories and visible damage."
            >
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={6}
                  placeholder="Example: TV is in working condition. Remote and power cable are included..."
                  className="admin-input resize-none"
                />

                <p className="mt-2 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                  Give customers enough information to decide whether they
                  should enquire.
                </p>
              </FormField>
            </FormSection>

            <FormSection
              title="Product image"
              description="Upload one clear image for the public product listing."
            >
              <ProductImageUpload
                imagePreview={imagePreview}
                selectedImage={selectedImage}
                imageError={imageError}
                onChange={handleProductImageChange}
                onRemove={removeProductImage}
              />
            </FormSection>

            <FormSection
              title="Publishing options"
              description="Control where and how this product appears."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ToggleCard
                  checked={form.isAvailable}
                  onChange={(checked) => updateField("isAvailable", checked)}
                  title="Publicly available"
                  description="Show this product on the public products page."
                />

                <ToggleCard
                  checked={form.isFeatured}
                  onChange={(checked) => updateField("isFeatured", checked)}
                  title="Featured product"
                  description="Highlight this product in featured areas."
                />
              </div>

              <div className="mt-4">
                <ToggleCard
                  checked={form.createAnnouncement}
                  onChange={(checked) =>
                    updateField("createAnnouncement", checked)
                  }
                  title="Homepage announcement"
                  description="Create a new-product announcement when this product is published."
                />
              </div>
            </FormSection>

            {form.createAnnouncement && (
              <FormSection
                title="Announcement details"
                description="Configure the announcement shown on the homepage."
              >
                <div className="space-y-5">
                  <FormField label="Announcement title" required>
                    <input
                      value={form.announcementTitle}
                      onChange={(event) =>
                        updateField("announcementTitle", event.target.value)
                      }
                      placeholder="LG Smart TV is now available"
                      className="admin-input"
                    />
                  </FormField>

                  <FormField label="Announcement message" required>
                    <textarea
                      value={form.announcementMessage}
                      onChange={(event) =>
                        updateField("announcementMessage", event.target.value)
                      }
                      rows={4}
                      placeholder={`This product is now available at ${settings.shopName}`}
                      className="admin-input resize-none"
                    />
                  </FormField>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <UniversalDropdown<number>
                      label="Priority"
                      options={announcementPriorityOptions}
                      value={form.announcementPriority}
                      onChange={(value) =>
                        updateField("announcementPriority", value)
                      }
                      placeholder="Select priority"
                    />

                    <FormField label="End date and time">
                      <input
                        type="datetime-local"
                        value={form.announcementEndAt}
                        onChange={(event) =>
                          updateField("announcementEndAt", event.target.value)
                        }
                        className="admin-input"
                      />
                    </FormField>
                  </div>
                </div>
              </FormSection>
            )}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <ProductPreview
              productName={form.productName}
              brand={form.brand}
              modelName={form.modelName}
              categoryName={selectedCategoryName}
              conditionName={selectedConditionName}
              price={previewPrice}
              stockQuantity={form.stockQuantity}
              imagePreview={imagePreview}
              isAvailable={form.isAvailable}
              isFeatured={form.isFeatured}
            />

            <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              <h2 className="text-lg font-black">Publish product</h2>

              <p className="mt-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                Check the preview and required fields before creating the
                listing.
              </p>

              <div className="mt-5 space-y-2">
                <ChecklistItem completed={form.productCategoryId > 0}>
                  Category selected
                </ChecklistItem>

                <ChecklistItem completed={form.productConditionId > 0}>
                  Condition selected
                </ChecklistItem>

                <ChecklistItem completed={form.productName.trim().length >= 2}>
                  Product name added
                </ChecklistItem>

                <ChecklistItem
                  completed={
                    form.price.trim() !== "" && Number(form.price) >= 0
                  }
                >
                  Price added
                </ChecklistItem>

                <ChecklistItem completed={Boolean(selectedImage)} optional>
                  Product image added
                </ChecklistItem>
              </div>

              <div className="mt-6 space-y-3">
                <ActionButton
                  type="button"
                  loading={saving}
                  loadingText=""
                  variant="dark"
                  fullWidth
                  spinnerOnly
                  className="h-12 cursor-pointer rounded-xl"
                >
                  Add Product
                </ActionButton>

                <Link
                  to="/admin/products"
                  aria-disabled={saving}
                  className={`inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#d8cdb6] text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016] ${
                    saving ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Cancel
                </Link>
              </div>
            </section>
          </aside>
        </form>
      </section>
    </main>
  );
}

function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="border-b border-[#d8cdb6] pb-4 dark:border-[#302c24]">
        <h2 className="text-xl font-black tracking-tight">{title}</h2>

        <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required = false,
  children
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
        {label}

        {required && (
          <span className="ml-1 text-red-600 dark:text-red-300">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

function ProductImageUpload({
  imagePreview,
  selectedImage,
  imageError,
  onChange,
  onRemove
}: {
  imagePreview: string;
  selectedImage: File | null;
  imageError: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      {!imagePreview ? (
        <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#c9b998] bg-[#fffaf0] px-6 py-8 text-center transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#40392e] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/60 dark:hover:bg-[#1d1912]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={onChange}
            className="hidden"
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            <UploadIcon />
          </div>

          <p className="mt-4 text-sm font-black">Upload product image</p>

          <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            Choose a JPG, PNG or WEBP image smaller than 5MB. SVG files are not
            supported.
          </p>
        </label>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]">
          <div className="flex h-72 items-center justify-center bg-[#f3efe6] p-5 dark:bg-[#0f0e0c]">
            <img
              src={imagePreview}
              alt="Selected product preview"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-[#d8cdb6] p-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">
                {selectedImage?.name || "Product image"}
              </p>

              {selectedImage && (
                <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  {formatFileSize(selectedImage.size)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
            >
              Remove image
            </button>
          </div>
        </div>
      )}

      {imageError && (
        <p
          role="alert"
          className="mt-3 text-sm font-bold text-red-600 dark:text-red-300"
        >
          {imageError}
        </p>
      )}
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition ${
        checked
          ? "border-[#d6b46a] bg-[#fff4cc] dark:border-[#d6b46a]/50 dark:bg-[#d6b46a]/10"
          : "border-[#d8cdb6] bg-[#fffaf0] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-black">{title}</p>

        <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#1f1a12] dark:bg-[#d6b46a]"
            : "bg-[#cfc4ae] dark:bg-[#40392e]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </label>
  );
}

function ProductPreview({
  productName,
  brand,
  modelName,
  categoryName,
  conditionName,
  price,
  stockQuantity,
  imagePreview,
  isAvailable,
  isFeatured
}: {
  productName: string;
  brand: string;
  modelName: string;
  categoryName: string;
  conditionName: string;
  price: string;
  stockQuantity: string;
  imagePreview: string;
  isAvailable: boolean;
  isFeatured: boolean;
}) {
  const productMeta =
    [brand.trim(), modelName.trim()].filter(Boolean).join(" • ") ||
    "Brand and model";

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="border-b border-[#d8cdb6] px-5 py-4 dark:border-[#302c24]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
          Live preview
        </p>
      </div>

      <div className="flex aspect-[4/3] items-center justify-center bg-[#f3efe6] p-5 dark:bg-[#0f0e0c]">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fff4cc] text-2xl font-black text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            TE
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <PreviewBadge>{categoryName}</PreviewBadge>
          <PreviewBadge>{conditionName}</PreviewBadge>

          <AvailabilityBadge isAvailable={isAvailable} />
        </div>

        {isFeatured && (
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
            Featured product
          </p>
        )}

        <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight">
          {productName.trim() || "Product name"}
        </h2>

        <p className="mt-2 truncate text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {productMeta}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#d8cdb6] pt-4 dark:border-[#302c24]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Price
            </p>

            <p className="mt-1 text-2xl font-black">{price}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Stock
            </p>

            <p className="mt-1 text-sm font-black">{stockQuantity || "0"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChecklistItem({
  completed,
  optional = false,
  children
}: {
  completed: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
          completed
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
            : "border-[#d8cdb6] text-[#817867] dark:border-[#302c24] dark:text-[#928a7d]"
        }`}
      >
        {completed ? "✓" : ""}
      </span>

      <p className="text-xs font-bold">
        {children}

        {optional && (
          <span className="ml-1 font-semibold text-[#817867] dark:text-[#928a7d]">
            (optional)
          </span>
        )}
      </p>
    </div>
  );
}

function PreviewBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
      {children}
    </span>
  );
}

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return isAvailable ? (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
      Available
    </span>
  ) : (
    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
      Hidden
    </span>
  );
}

function CreateProductLoading() {
  return (
    <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-8 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-32 rounded bg-[#eee5d4] dark:bg-[#302c24]" />

        <div className="mt-6 h-40 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-72 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]"
              />
            ))}
          </div>

          <div className="h-[520px] rounded-[1.5rem] bg-[#eee5d4] dark:bg-[#242016]" />
        </div>
      </div>
    </main>
  );
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 16V5m0 0L8 9m4-4 4 4M5 15v4h14v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AdminCreateProductPage;
